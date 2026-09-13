import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AccountingService } from '../accounting/accounting.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { UpdateEnrollmentPriceDto } from './dto/update-enrollment-price.dto';
import { ChangeEnrollmentGroupDto } from './dto/change-enrollment-group.dto';

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

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly accounting: AccountingService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  // --- Vue Parent -----------------------------------------------------------

  /** RM-INS-047 : le Parent consulte à tout moment l'état des inscriptions de ses enfants. */
  async listMine(parentId: string): Promise<ParentViewEnrollment[]> {
    return this.prisma.enrollment.findMany({
      where: { student: { parentId } },
      include: INCLUDE_PARENT_VIEW,
      orderBy: { requestedAt: 'desc' },
    });
  }

  // Avenant 01, Ch. C/D.2, RM-PAR-021 : `create()` (demande d'inscription à l'initiative du Parent,
  // ex-Ch.12.5/12.6) a été retiré avec `POST /enrollments` — voir le commentaire d'en-tête du
  // contrôleur. Avenant 02 : toute inscription naît désormais directement `ACTIVE` — affectation
  // Professeur depuis sa salle d'attente (Ch. C, module séparé) ou préinscription confirmée par le
  // Parent (`PreEnrollmentsService.confirm()`) — il n'existe donc plus d'étape de décision du
  // Professeur ni d'annulation par le Parent avant décision (`accept`/`reject`/`cancel` retirés).

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
    // Un seul calcul par Parent distinct (plusieurs enfants du même Parent peuvent être inscrits
    // dans le même groupe) plutôt qu'un calcul par ligne.
    const parentIds = [...new Set(enrollments.map((e) => e.student.parentId))];
    const behaviorEntries = await Promise.all(
      parentIds.map(async (parentId) => [parentId, await this.computeParentPaymentBehavior(parentId)] as const),
    );
    const behaviorByParent = new Map(behaviorEntries);

    return enrollments.map((e) => ({
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
    return enrollment;
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

  /**
   * Avenant 02 : le changement de groupe est désormais une décision unilatérale et immédiate du
   * Professeur (plus de proposition ni de confirmation Parent, contrairement à l'ancien module
   * `group-change`) — même mécanique qu'une affectation depuis une salle d'attente
   * (`GroupMembersService.assignOne`) : le groupe cible doit appartenir au même Professeur, à la
   * même matière et au même niveau scolaire que l'inscription d'origine ; l'ancienne inscription
   * est archivée et une nouvelle inscription ACTIVE est créée dans le groupe cible, avec report du
   * solde comptable (`AccountingService.carryOverBalanceForGroupChange`, réutilisé tel quel).
   */
  async changeGroup(
    teacherId: string,
    groupId: string,
    enrollmentId: string,
    dto: ChangeEnrollmentGroupDto,
  ): Promise<TeacherViewEnrollment> {
    const enrollment = await this.loadOwnedEnrollment(teacherId, groupId, enrollmentId);
    if (enrollment.status !== 'ACTIVE') {
      throw new BadRequestException('Seule une inscription active peut changer de groupe');
    }
    if (dto.targetGroupId === groupId) {
      throw new BadRequestException('Le groupe cible est identique au groupe actuel');
    }

    const [originGroup, targetGroup] = await Promise.all([
      this.prisma.group.findUniqueOrThrow({ where: { id: groupId } }),
      this.prisma.group.findUnique({ where: { id: dto.targetGroupId } }),
    ]);
    if (!targetGroup || targetGroup.teacherId !== teacherId || targetGroup.kind !== 'STANDARD') {
      throw new NotFoundException('Groupe cible introuvable');
    }
    if (targetGroup.status === 'ARCHIVED' || targetGroup.status === 'CLOSED' || targetGroup.status === 'SUSPENDED') {
      throw new BadRequestException('Groupe cible fermé, suspendu ou archivé : changement impossible');
    }
    if (targetGroup.subjectId !== originGroup.subjectId || targetGroup.schoolLevelId !== originGroup.schoolLevelId) {
      throw new BadRequestException(
        'Le groupe cible doit enseigner la même matière et le même niveau scolaire que le groupe d’origine',
      );
    }

    const existingInTarget = await this.prisma.enrollment.findFirst({
      where: { studentId: enrollment.student.id, groupId: targetGroup.id, status: 'ACTIVE' },
    });
    if (existingInTarget) {
      throw new BadRequestException('Une inscription active existe déjà pour cet élève dans le groupe cible');
    }

    const activeCount = await this.prisma.enrollment.count({ where: { groupId: targetGroup.id, status: 'ACTIVE' } });
    if (activeCount >= targetGroup.capacity) {
      throw new BadRequestException('Changement de groupe impossible : groupe cible complet');
    }

    const newEnrollment = await this.prisma.$transaction(async (tx) => {
      await tx.enrollment.update({ where: { id: enrollmentId }, data: { status: 'ARCHIVED' } });
      await this.reopenGroupIfBelowCapacity(tx, groupId);

      const created = await tx.enrollment.create({
        data: {
          studentId: enrollment.student.id,
          groupId: targetGroup.id,
          status: 'ACTIVE',
          customPrice: enrollment.customPrice ?? undefined,
          requestedAt: new Date(),
          decidedAt: new Date(),
          decidedById: teacherId,
          origin: 'GROUP_CHANGE',
        },
      });

      const newAccount = await this.accounting.createAccountForEnrollment(tx, created.id, targetGroup.academicYearId);
      await this.accounting.carryOverBalanceForGroupChange(tx, {
        originalEnrollmentId: enrollmentId,
        newAccount,
        authorId: teacherId,
      });

      if (activeCount + 1 >= targetGroup.capacity) {
        await tx.group.update({ where: { id: targetGroup.id }, data: { status: 'FULL' } });
      }

      await tx.auditLog.create({
        data: {
          userId: teacherId,
          action: 'ENROLLMENT_GROUP_CHANGED',
          targetType: 'Enrollment',
          targetId: created.id,
          oldValues: { enrollmentId, groupId },
          newValues: { enrollmentId: created.id, groupId: targetGroup.id },
        },
      });

      return tx.enrollment.findUniqueOrThrow({ where: { id: created.id }, include: INCLUDE_TEACHER_VIEW });
    });

    // NOT-INS : hors transaction — un échec d'envoi ne doit jamais annuler le changement.
    await this.notifications.notify({
      recipientUserId: newEnrollment.student.parentId,
      type: 'ENROLLMENT_GROUP_CHANGED',
      priority: 'IMPORTANT',
      title: 'Changement de groupe',
      body: `${newEnrollment.student.firstName} ${newEnrollment.student.lastName} a été déplacé·e vers le groupe "${targetGroup.name}".`,
      refType: 'Enrollment',
      refId: newEnrollment.id,
    });

    return newEnrollment;
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
