import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AccountingService } from '../accounting/accounting.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { AcceptEnrollmentDto } from './dto/accept-enrollment.dto';
import { RejectEnrollmentDto } from './dto/reject-enrollment.dto';
import { UpdateEnrollmentPriceDto } from './dto/update-enrollment-price.dto';

/** Ch.12 : vue Parent — infos du groupe/professeur/matière/niveau, jamais le téléphone du Professeur ici. */
const INCLUDE_PARENT_VIEW = {
  student: { select: { id: true, firstName: true, lastName: true, parentId: true } },
  group: {
    select: {
      id: true,
      name: true,
      status: true,
      publicPrice: true,
      teachingMode: true,
      subject: true,
      schoolLevel: true,
      academicYear: true,
      teacher: { select: { firstName: true, lastName: true, city: true } },
      // Ch.12/10.6 : jour/horaire du planning hebdomadaire — affichés au Parent, jamais la capacité (privée).
      schedules: { select: { dayOfWeek: true, startTime: true, durationMinutes: true } },
    },
  },
} satisfies Prisma.EnrollmentInclude;

/**
 * Ch.12.7/RM-PAR-007/008 : vue Professeur — établissement/niveau/classe issus de la situation
 * scolaire active de l'élève, nom du Parent, mais jamais son téléphone (donnée privée).
 */
const INCLUDE_TEACHER_VIEW = {
  student: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      parentId: true,
      parent: { select: { firstName: true, lastName: true, user: { select: { email: true } } } },
      currentSchoolSituation: {
        select: {
          school: { select: { name: true } },
          schoolLevel: { select: { name: true } },
          class: true,
        },
      },
    },
  },
  group: {
    select: {
      id: true,
      name: true,
      capacity: true,
      status: true,
      schedules: { select: { dayOfWeek: true, startTime: true, durationMinutes: true } },
    },
  },
} satisfies Prisma.EnrollmentInclude;

type ParentViewEnrollment = Prisma.EnrollmentGetPayload<{ include: typeof INCLUDE_PARENT_VIEW }>;
type TeacherViewEnrollment = Prisma.EnrollmentGetPayload<{ include: typeof INCLUDE_TEACHER_VIEW }>;

/** RM-INS-014/015 : indicateur synthétique — jamais de montant ni de détail (RM-INS-016). */
type ParentPaymentBehavior = 'EXCELLENT' | 'MOYEN' | 'MAUVAIS' | 'NON_DISPONIBLE';
type TeacherViewEnrollmentWithPaymentBehavior = TeacherViewEnrollment & {
  parentPaymentBehavior: ParentPaymentBehavior;
};

const EXPIRY_DELAY_MS = 7 * 24 * 60 * 60 * 1000; // RM-INS-026 : délai de réponse de 7 jours

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
    private readonly accounting: AccountingService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  // -------------------------------------------------------------------------
  // RM-INS-026/ERR-INS-011 : expiration paresseuse.
  // Ce projet ne dispose d'aucun mécanisme de job planifié (cron). Plutôt que d'introduire une
  // dépendance de scheduling pour ce seul besoin, l'expiration à J+7 est appliquée à la lecture :
  // chaque fois qu'une Enrollment PENDING_VALIDATION est chargée (liste ou détail) et que son
  // délai de réponse est dépassé, elle est transformée en EXPIRED avant d'être retournée. Ce
  // helper est réutilisé par toutes les méthodes de lecture ci-dessous.
  // -------------------------------------------------------------------------
  private async expireIfDue<T extends { id: string; status: EnrollmentStatus; requestedAt: Date }>(
    enrollment: T,
  ): Promise<T> {
    if (enrollment.status !== 'PENDING_VALIDATION') {
      return enrollment;
    }
    const deadline = new Date(enrollment.requestedAt.getTime() + EXPIRY_DELAY_MS);
    if (deadline > new Date()) {
      return enrollment;
    }
    await this.prisma.enrollment.update({ where: { id: enrollment.id }, data: { status: 'EXPIRED' } });
    (enrollment as { status: EnrollmentStatus }).status = 'EXPIRED';
    return enrollment;
  }

  private async expireManyIfDue<T extends { id: string; status: EnrollmentStatus; requestedAt: Date }>(
    enrollments: T[],
  ): Promise<T[]> {
    return Promise.all(enrollments.map((e) => this.expireIfDue(e)));
  }

  // --- Vue Parent -----------------------------------------------------------

  /** RM-INS-047 : le Parent consulte à tout moment l'état de ses demandes d'inscription. */
  async listMine(parentId: string): Promise<ParentViewEnrollment[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { student: { parentId } },
      include: INCLUDE_PARENT_VIEW,
      orderBy: { requestedAt: 'desc' },
    });
    return this.expireManyIfDue(enrollments);
  }

  /** RM-PAR-011/018 (transposé Ch.12) : un Parent n'accède jamais à l'inscription d'un autre. */
  private async loadOwnedByParent(parentId: string, enrollmentId: string): Promise<ParentViewEnrollment> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: INCLUDE_PARENT_VIEW,
    });
    if (!enrollment) {
      throw new NotFoundException('Inscription introuvable');
    }
    if (enrollment.student.parentId !== parentId) {
      throw new ForbiddenException("Cette inscription n'appartient pas à votre compte");
    }
    return this.expireIfDue(enrollment);
  }

  /**
   * Ch.12.5/12.6 : vérifications automatiques avant création d'une demande d'inscription
   * (ERR-INS-001 à 009, 016, 027, 028, RM-INS-011). La capacité d'abonnement du Professeur est
   * désormais vérifiée ici aussi (RM-INS-011/RM-INS-025/ERR-INS-008), avec la même méthode que
   * celle réutilisée à l'acceptation (`SubscriptionsService.assertActiveEnrollmentCapacity`) : si
   * elle est déjà atteinte, la demande n'a de toute façon aucune chance d'être acceptée un jour, et
   * ERR-INS-008 est un refus, jamais un simple avertissement. Restent hors scope volontairement :
   *  - le compte de suivi comptable (RM-CPT-001/002 : créé uniquement à l'activation, en ACTIVE) ;
   *  - le comportement de paiement du Parent, qui ne concerne que la décision du Professeur
   *    (RM-INS-014/015, exposé par `listByGroup`, jamais côté création par le Parent).
   */
  async create(parentId: string, dto: CreateEnrollmentDto): Promise<ParentViewEnrollment> {
    // 1) L'élève appartient au Parent connecté et n'est pas archivé.
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      include: { currentSchoolSituation: true },
    });
    if (!student || student.parentId !== parentId) {
      throw new BadRequestException("L'élève n'appartient pas au parent connecté (ERR-INS-028)");
    }
    if (student.status === 'ARCHIVED') {
      throw new BadRequestException('Élève archivé : création de la demande impossible (ERR-INS-010)');
    }

    // 2) Le groupe existe et ses inscriptions sont ouvertes (status ACTIVE = "OUVERT").
    const group = await this.prisma.group.findUnique({
      where: { id: dto.groupId },
      include: { academicYear: true, teacher: { include: { user: true } } },
    });
    if (!group) {
      throw new NotFoundException('Groupe introuvable');
    }
    if (group.status !== 'ACTIVE') {
      if (group.status === 'ARCHIVED') {
        throw new BadRequestException('Groupe archivé : création de la demande impossible (ERR-INS-003)');
      }
      if (group.status === 'SUSPENDED') {
        throw new BadRequestException('Groupe suspendu : création de la demande impossible (ERR-INS-007)');
      }
      if (group.status === 'FULL') {
        throw new BadRequestException('Groupe complet (ERR-INS-001)');
      }
      throw new BadRequestException('Inscriptions fermées pour ce groupe (ERR-INS-016)');
    }

    // 3) Le Professeur du groupe est toujours actif (profil validé + compte actif).
    if (group.teacher.status !== 'VALIDATED' || group.teacher.user.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Professeur suspendu ou inactif : création de la demande impossible (ERR-INS-005)',
      );
    }

    // 3bis) RM-INS-011/025/ERR-INS-008 : capacité d'abonnement du Professeur non déjà atteinte —
    // même vérification que celle réutilisée à l'acceptation (voir `accept`/`reactivate`).
    await this.subscriptions.assertActiveEnrollmentCapacity(group.teacherId, 1, 'ERR-INS-008');

    // 4) Le Parent est validé (compte actif).
    const parentUser = await this.prisma.user.findUnique({ where: { id: parentId } });
    if (!parentUser || parentUser.status !== 'ACTIVE') {
      throw new BadRequestException('Parent non validé : création de la demande refusée (ERR-INS-004/024)');
    }

    // 5) L'année académique du groupe est ouverte.
    if (group.academicYear.status !== 'OPEN') {
      throw new BadRequestException('Année académique clôturée : création de la demande impossible (ERR-INS-006)');
    }

    // 6) Capacité du groupe non atteinte (RM-INS-041 : seules les inscriptions ACTIVE consomment une place).
    const activeCount = await this.prisma.enrollment.count({
      where: { groupId: group.id, status: 'ACTIVE' },
    });
    if (activeCount >= group.capacity) {
      throw new BadRequestException('Groupe complet (ERR-INS-001)');
    }

    // 7) Pas déjà de demande PENDING_VALIDATION ou d'inscription ACTIVE pour ce couple élève/groupe.
    const existing = await this.prisma.enrollment.findFirst({
      where: { studentId: student.id, groupId: group.id, status: { in: ['PENDING_VALIDATION', 'ACTIVE'] } },
    });
    if (existing) {
      throw new BadRequestException(
        existing.status === 'ACTIVE'
          ? 'Inscription déjà active pour cet élève dans ce groupe (ERR-INS-032)'
          : "Une demande d'inscription est déjà en attente pour cet élève dans ce groupe (ERR-INS-002/009)",
      );
    }

    // 8) La situation scolaire active de l'élève doit correspondre à l'année académique du groupe.
    if (!student.currentSchoolSituation || student.currentSchoolSituation.academicYearId !== group.academicYearId) {
      throw new BadRequestException(
        "L'année académique du groupe est incompatible avec la situation scolaire active de l'élève (ERR-INS-027)",
      );
    }

    const created = await this.prisma.enrollment.create({
      data: {
        studentId: student.id,
        groupId: group.id,
        status: 'PENDING_VALIDATION',
        requestedAt: new Date(),
      },
      include: INCLUDE_PARENT_VIEW,
    });
    return created;
  }

  /** RM-INS-038/049 : annulation possible tant qu'aucune décision du Professeur n'est enregistrée. */
  async cancel(parentId: string, enrollmentId: string): Promise<ParentViewEnrollment> {
    const enrollment = await this.loadOwnedByParent(parentId, enrollmentId);
    if (enrollment.status === 'CANCELLED') {
      throw new BadRequestException('Cette demande est déjà annulée (ERR-INS-019)');
    }
    if (enrollment.status !== 'PENDING_VALIDATION') {
      throw new BadRequestException('Cette demande a déjà été traitée : annulation impossible (ERR-INS-017/020)');
    }
    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'CANCELLED' },
      include: INCLUDE_PARENT_VIEW,
    });
  }

  // --- Vue Professeur ---------------------------------------------------------

  /** Même schéma de vérification que GroupsService.loadOwned : le groupe doit appartenir au Professeur. */
  private async loadOwnedGroup(teacherId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Groupe introuvable');
    }
    if (group.teacherId !== teacherId) {
      throw new ForbiddenException("Ce groupe n'appartient pas à votre compte");
    }
    return group;
  }

  /**
   * Ch.12.7/RM-INS-014/015/016 : c'est ici (liste consultée par le Professeur avant de décider)
   * que l'indicateur de comportement de paiement du Parent est exposé — un label synthétique par
   * ligne, jamais de détail chiffré.
   */
  async listByGroup(teacherId: string, groupId: string): Promise<TeacherViewEnrollmentWithPaymentBehavior[]> {
    await this.loadOwnedGroup(teacherId, groupId);
    const enrollments = await this.prisma.enrollment.findMany({
      where: { groupId },
      include: INCLUDE_TEACHER_VIEW,
      orderBy: { requestedAt: 'desc' },
    });
    const expired = await this.expireManyIfDue(enrollments);

    // Un seul calcul par Parent distinct (plusieurs enfants du même Parent peuvent être inscrits
    // dans le même groupe) plutôt qu'un calcul par ligne.
    const parentIds = [...new Set(expired.map((e) => e.student.parentId))];
    const behaviorEntries = await Promise.all(
      parentIds.map(async (parentId) => [parentId, await this.computeParentPaymentBehavior(parentId)] as const),
    );
    const behaviorByParent = new Map(behaviorEntries);

    return expired.map((e) => ({
      ...e,
      parentPaymentBehavior: behaviorByParent.get(e.student.parentId) ?? 'NON_DISPONIBLE',
    }));
  }

  /**
   * RM-INS-014/029 : comportement de paiement du Parent — calculé à partir de l'historique de
   * TOUTES ses inscriptions, tous enfants confondus (l'indicateur est attaché au Parent, pas à un
   * seul enfant ni à un seul Professeur), toutes années confondues si l'année académique en cours
   * n'a encore aucune séance facturée (RM-INS-029 : « en début d'année académique, le comportement
   * de paiement est calculé sur l'année précédente si disponible »— généralisé ici à tout
   * l'historique disponible plutôt qu'à la seule année précédente, faute d'un moyen fiable de
   * désigner « l'année précédente » unique dans un projet qui autorise plusieurs années OPEN
   * simultanées, cf. le commentaire de `SubscriptionsService.assertCanWrite`).
   *
   * Formule (Annexe 25.9/RM-CAL-012 — seuils par défaut du référentiel, aucune autre valeur
   * paramétrée trouvée ailleurs dans le code, donc reprise telle quelle) : taux d'encaissement =
   * montant réglé / montant facturé (écritures SESSION) sur l'historique retenu.
   *   - Excellent : taux >= 90 %
   *   - Moyen     : 50 % <= taux < 90 %
   *   - Mauvais   : taux < 50 %
   *   - Aucune séance jamais facturée (ni année en cours, ni historique) : 'NON_DISPONIBLE'.
   *
   * RM-INS-016 : seul ce label est renvoyé — jamais un solde, un montant ou le détail d'un compte,
   * qui resteraient de toute façon invisibles à un autre Professeur que celui propriétaire du compte.
   */
  private async computeParentPaymentBehavior(parentId: string): Promise<ParentPaymentBehavior> {
    const entries = await this.prisma.accountingEntry.findMany({
      where: {
        status: { not: 'CREATED' }, // RM-CPT-037 : jamais un brouillon.
        account: { enrollment: { student: { parentId } } },
      },
      select: {
        type: true,
        direction: true,
        amount: true,
        account: { select: { period: { select: { academicYear: { select: { status: true } } } } } },
      },
    });
    if (entries.length === 0) return 'NON_DISPONIBLE';

    const paymentRateOf = (rows: typeof entries): number | null => {
      const invoiced = rows.filter((e) => e.type === 'SESSION').reduce((sum, e) => sum + Number(e.amount), 0);
      if (invoiced <= 0) return null;
      const paid = rows
        .filter((e) => e.type === 'PAYMENT')
        .reduce((sum, e) => sum + (e.direction === 'CREDIT' ? Number(e.amount) : -Number(e.amount)), 0);
      return (paid / invoiced) * 100;
    };

    const currentYearEntries = entries.filter((e) => e.account.period.academicYear.status === 'OPEN');
    const rate = paymentRateOf(currentYearEntries) ?? paymentRateOf(entries);
    if (rate === null) return 'NON_DISPONIBLE';
    if (rate >= 90) return 'EXCELLENT';
    if (rate >= 50) return 'MOYEN';
    return 'MAUVAIS';
  }

  private async loadOwnedEnrollment(
    teacherId: string,
    groupId: string,
    enrollmentId: string,
  ): Promise<TeacherViewEnrollment> {
    await this.loadOwnedGroup(teacherId, groupId);
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: INCLUDE_TEACHER_VIEW,
    });
    if (!enrollment || enrollment.groupId !== groupId) {
      throw new NotFoundException('Inscription introuvable');
    }
    return this.expireIfDue(enrollment);
  }

  /**
   * Ch.12.7/RM-INS-025/039/054/055/056 : la capacité du groupe est revérifiée au moment exact de
   * la décision. Si l'acceptation fait atteindre la capacité, le groupe passe automatiquement
   * FULL (miroir de GroupsService, appliqué directement ici pour ne pas coupler les deux modules).
   */
  async accept(
    teacherId: string,
    groupId: string,
    enrollmentId: string,
    dto: AcceptEnrollmentDto,
  ): Promise<TeacherViewEnrollment> {
    const enrollment = await this.loadOwnedEnrollment(teacherId, groupId, enrollmentId);
    if (enrollment.status !== 'PENDING_VALIDATION') {
      throw new BadRequestException('Cette demande a déjà été traitée (ERR-INS-017)');
    }

    const group = await this.prisma.group.findUniqueOrThrow({ where: { id: groupId } });
    if (group.status === 'ARCHIVED' || group.status === 'SUSPENDED' || group.status === 'CLOSED') {
      throw new BadRequestException(
        'Groupe fermé, suspendu ou archivé : acceptation de la demande impossible (ERR-INS-026)',
      );
    }

    const activeCount = await this.prisma.enrollment.count({ where: { groupId, status: 'ACTIVE' } });
    await this.subscriptions.assertActiveEnrollmentCapacity(teacherId, 1, 'ERR-INS-008/ERR-INS-013');
    if (activeCount >= group.capacity) {
      throw new BadRequestException(
        "La capacité du groupe n'est plus disponible au moment de l'acceptation (ERR-INS-030/039/056)",
      );
    }

    // RM-GRP-022 : le tarif effectif est toujours figé par inscription au moment de l'activation,
    // jamais recalculé depuis `group.publicPrice` après coup. Si le Professeur ne fixe pas de tarif
    // personnalisé à l'acceptation, `customPrice` est explicitement figé à la valeur actuelle du
    // tarif public du groupe — un changement ultérieur de ce tarif n'impacte donc plus jamais cette
    // inscription déjà active.
    const fixedCustomPrice = dto.customPrice !== undefined ? dto.customPrice : enrollment.customPrice ?? group.publicPrice;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: 'ACTIVE',
          decidedAt: new Date(),
          decidedById: teacherId,
          customPrice: fixedCustomPrice,
        },
      });

      // RM-CPT-002 : compte de suivi comptable créé automatiquement à l'activation de l'inscription.
      await this.accounting.createAccountForEnrollment(tx, enrollmentId, group.academicYearId);

      if (activeCount + 1 >= group.capacity) {
        await tx.group.update({ where: { id: groupId }, data: { status: 'FULL' } });
      }

      // RM-ACC-019/020 : traçabilité centralisée de l'acceptation d'une demande d'inscription.
      await tx.auditLog.create({
        data: {
          userId: teacherId,
          action: 'ENROLLMENT_ACCEPTED',
          targetType: 'Enrollment',
          targetId: enrollmentId,
          oldValues: { status: 'PENDING_VALIDATION' },
          newValues: { status: 'ACTIVE', customPrice: Number(fixedCustomPrice) },
        },
      });

      // Relu après toutes les mutations : le `group` inclus doit refléter l'état final (ex. FULL),
      // pas un instantané capturé avant la mise à jour du groupe dans cette même transaction.
      return tx.enrollment.findUniqueOrThrow({ where: { id: enrollmentId }, include: INCLUDE_TEACHER_VIEW });
    });

    // NOT-INS-002 : hors transaction — un échec d'envoi ne doit jamais annuler la décision.
    await this.notifications.notify({
      recipientUserId: updated.student.parentId,
      type: 'INS_ACCEPTED',
      priority: 'IMPORTANT',
      title: 'Demande d’inscription acceptée',
      body: `La demande d'inscription de ${updated.student.firstName} ${updated.student.lastName} au groupe "${updated.group.name}" a été acceptée.`,
      refType: 'Enrollment',
      refId: updated.id,
      sendEmail: () =>
        this.email.sendEnrollmentAccepted(
          updated.student.parent.user.email,
          `${updated.student.firstName} ${updated.student.lastName}`,
          updated.group.name,
        ),
    });
    return updated;
  }

  async reject(
    teacherId: string,
    groupId: string,
    enrollmentId: string,
    _dto: RejectEnrollmentDto,
  ): Promise<TeacherViewEnrollment> {
    const enrollment = await this.loadOwnedEnrollment(teacherId, groupId, enrollmentId);
    if (enrollment.status !== 'PENDING_VALIDATION') {
      throw new BadRequestException('Cette demande a déjà été traitée (ERR-INS-017)');
    }
    const updated = await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'REJECTED', decidedAt: new Date(), decidedById: teacherId },
      include: INCLUDE_TEACHER_VIEW,
    });

    // RM-ACC-019/020 : traçabilité du refus — pas de transaction Prisma existante ici (simple mise
    // à jour), donc journalisation best-effort, non bloquante.
    await this.prisma.auditLog.create({
      data: {
        userId: teacherId,
        action: 'ENROLLMENT_REJECTED',
        targetType: 'Enrollment',
        targetId: enrollmentId,
        oldValues: { status: 'PENDING_VALIDATION' },
        newValues: { status: 'REJECTED' },
      },
    });

    // NOT-INS-003
    await this.notifications.notify({
      recipientUserId: updated.student.parentId,
      type: 'INS_REJECTED',
      priority: 'IMPORTANT',
      title: 'Demande d’inscription refusée',
      body: `La demande d'inscription de ${updated.student.firstName} ${updated.student.lastName} au groupe "${updated.group.name}" a été refusée.`,
      refType: 'Enrollment',
      refId: updated.id,
      sendEmail: () =>
        this.email.sendEnrollmentRejected(
          updated.student.parent.user.email,
          `${updated.student.firstName} ${updated.student.lastName}`,
          updated.group.name,
        ),
    });
    return updated;
  }

  /**
   * Ch.12.8/RM-INS-017/018/019 : le tarif personnalisé n'est modifiable que sur une inscription
   * active, et seulement tant qu'aucune séance n'a déjà été facturée sur son compte de suivi
   * comptable (RM-INS-019/ERR-INS-014) — au-delà, les séances déjà réalisées ne peuvent jamais
   * être recalculées (RM-INS-018), donc le tarif qui les a facturées ne doit plus bouger non plus.
   */
  async updatePrice(
    teacherId: string,
    groupId: string,
    enrollmentId: string,
    dto: UpdateEnrollmentPriceDto,
  ): Promise<TeacherViewEnrollment> {
    const enrollment = await this.loadOwnedEnrollment(teacherId, groupId, enrollmentId);
    if (enrollment.status === 'ARCHIVED') {
      throw new BadRequestException('Inscription archivée : toute modification est interdite (ERR-INS-018)');
    }
    if (enrollment.status !== 'ACTIVE') {
      throw new BadRequestException('Le tarif personnalisé ne peut être modifié que sur une inscription active');
    }

    // RM-INS-019/ERR-INS-014 : lecture seule via Prisma (le compte est géré par AccountingService,
    // hors périmètre d'édition ici) — au moins une écriture SESSION postée sur ce compte interdit
    // toute modification ultérieure du tarif.
    const account = await this.prisma.accountingAccount.findUnique({ where: { enrollmentId } });
    if (account) {
      const billedSessionCount = await this.prisma.accountingEntry.count({
        where: { accountId: account.id, type: 'SESSION' },
      });
      if (billedSessionCount > 0) {
        throw new BadRequestException(
          'Au moins une séance a déjà été facturée sur cette inscription : le tarif personnalisé ne peut plus être modifié (ERR-INS-014)',
        );
      }
    }

    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { customPrice: dto.customPrice },
      include: INCLUDE_TEACHER_VIEW,
    });
  }

  /**
   * RM-INS-041/042/051 : une inscription ACTIVE consomme une place ; sa suspension la libère
   * immédiatement (elle ne compte plus dans le calcul de capacité). Si le groupe était FULL, il
   * redevient ACTIVE dès qu'une place se libère ainsi.
   */
  async suspend(teacherId: string, groupId: string, enrollmentId: string): Promise<TeacherViewEnrollment> {
    const enrollment = await this.loadOwnedEnrollment(teacherId, groupId, enrollmentId);
    if (enrollment.status !== 'ACTIVE') {
      throw new BadRequestException('Seule une inscription active peut être suspendue');
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.enrollment.update({ where: { id: enrollmentId }, data: { status: 'SUSPENDED' } });
      await this.reopenGroupIfBelowCapacity(tx, groupId);
      // RM-ACC-019/020 : traçabilité centralisée de la suspension d'une inscription.
      await tx.auditLog.create({
        data: {
          userId: teacherId,
          action: 'ENROLLMENT_SUSPENDED',
          targetType: 'Enrollment',
          targetId: enrollmentId,
          oldValues: { status: 'ACTIVE' },
          newValues: { status: 'SUSPENDED' },
        },
      });
      return tx.enrollment.findUniqueOrThrow({ where: { id: enrollmentId }, include: INCLUDE_TEACHER_VIEW });
    });
  }

  /** RM-INS-039/042 : la réactivation reconsomme une place — revérifiée à cet instant précis. */
  async reactivate(teacherId: string, groupId: string, enrollmentId: string): Promise<TeacherViewEnrollment> {
    const enrollment = await this.loadOwnedEnrollment(teacherId, groupId, enrollmentId);
    if (enrollment.status !== 'SUSPENDED') {
      throw new BadRequestException(
        'Réactivation impossible : seule une inscription suspendue peut être réactivée (ERR-INS-021/022/023)',
      );
    }
    const group = await this.prisma.group.findUniqueOrThrow({ where: { id: groupId } });
    const activeCount = await this.prisma.enrollment.count({ where: { groupId, status: 'ACTIVE' } });
    await this.subscriptions.assertActiveEnrollmentCapacity(teacherId, 1, 'ERR-INS-008/ERR-INS-013');
    if (activeCount >= group.capacity) {
      throw new BadRequestException('La capacité du groupe est atteinte : réactivation impossible (ERR-INS-030)');
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.enrollment.update({ where: { id: enrollmentId }, data: { status: 'ACTIVE' } });
      if (activeCount + 1 >= group.capacity) {
        await tx.group.update({ where: { id: groupId }, data: { status: 'FULL' } });
      }
      return tx.enrollment.findUniqueOrThrow({ where: { id: enrollmentId }, include: INCLUDE_TEACHER_VIEW });
    });
  }

  /** RM-INS-033/043/051/053 : une inscription archivée est définitive et libère sa place si active. */
  async archive(teacherId: string, groupId: string, enrollmentId: string): Promise<TeacherViewEnrollment> {
    const enrollment = await this.loadOwnedEnrollment(teacherId, groupId, enrollmentId);
    if (enrollment.status !== 'ACTIVE' && enrollment.status !== 'SUSPENDED') {
      throw new BadRequestException('Seule une inscription active ou suspendue peut être archivée');
    }
    const wasActive = enrollment.status === 'ACTIVE';
    return this.prisma.$transaction(async (tx) => {
      await tx.enrollment.update({ where: { id: enrollmentId }, data: { status: 'ARCHIVED' } });
      if (wasActive) {
        await this.reopenGroupIfBelowCapacity(tx, groupId);
      }
      return tx.enrollment.findUniqueOrThrow({ where: { id: enrollmentId }, include: INCLUDE_TEACHER_VIEW });
    });
  }

  private async reopenGroupIfBelowCapacity(tx: Prisma.TransactionClient, groupId: string): Promise<void> {
    const group = await tx.group.findUniqueOrThrow({ where: { id: groupId } });
    if (group.status !== 'FULL') {
      return;
    }
    const activeCount = await tx.enrollment.count({ where: { groupId, status: 'ACTIVE' } });
    if (activeCount < group.capacity) {
      await tx.group.update({ where: { id: groupId }, data: { status: 'ACTIVE' } });
    }
  }
}
