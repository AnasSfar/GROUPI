import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AcademicYear, PreEnrollmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreatePreEnrollmentDto } from './dto/create-pre-enrollment.dto';
import { UpdatePreEnrollmentDto } from './dto/update-pre-enrollment.dto';
import { ProposePreEnrollmentDto } from './dto/propose-pre-enrollment.dto';
import { EligibleTeachersQueryDto } from './dto/eligible-teachers-query.dto';
import { AdminListPreEnrollmentsQueryDto } from './dto/admin-list-pre-enrollments-query.dto';

const INCLUDE_DETAILS = {
  student: { select: { id: true, firstName: true, lastName: true } },
  /** Ch.11.5 : le Professeur consulte les coordonnées des Parents ayant préinscrit un élève. */
  parent: {
    select: { id: true, firstName: true, lastName: true, phone: true, city: true, user: { select: { email: true } } },
  },
  teacher: { select: { id: true, firstName: true, lastName: true, city: true } },
  schoolLevel: true,
  subject: true,
  academicYear: true,
  /** Ch.11.8 : détails nécessaires à la notification du Parent (horaires, lieu, tarif, places). */
  proposedGroup: {
    include: {
      schedules: { include: { teachingLocation: true } },
      _count: { select: { enrollments: true } },
    },
  },
} as const;

const ACTIVE_STATUSES = ['PENDING', 'PROPOSAL_SENT', 'CONFIRMED'] as const;

/** Shape minimale requise par `expireIfNeeded`, satisfaite par toutes les variantes incluses. */
interface ExpirableItem {
  id: string;
  status: string;
  expiresAt: Date | null;
}

@Injectable()
export class PreEnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  /**
   * Ch.11.3 : dans ce MVP il n'existe pas de notion formelle "d'ouverture/fermeture" des
   * préinscriptions choisie par le Professeur (ERR-PRE-003/006 non implémentées). Seule la
   * contrainte RM-PRE-023 est appliquée : une préinscription ne peut jamais viser une année déjà
   * commencée (en cours) ou déjà terminée — vérifié uniquement par comparaison de dates, ce qui
   * couvre les deux cas puisqu'une année terminée a nécessairement déjà commencé.
   */
  private assertFutureAcademicYear(academicYear: AcademicYear) {
    if (academicYear.startDate <= new Date()) {
      throw new BadRequestException(
        'Une préinscription ne peut concerner qu’une année académique future (RM-PRE-023/ERR-PRE-002)',
      );
    }
  }

  /**
   * RM-PRE-005/015, ERR-PRE-003/006 : le champ `Group.preEnrollmentsOpen` (schema.prisma) est
   * documenté « pour ce groupe », mais une préinscription précède par construction l'existence d'un
   * groupe pour l'année visée (RM-PRE-007 : les préinscriptions ne créent jamais un groupe). Faute
   * d'un réglage dédié au niveau du Professeur dans ce schéma, on utilise comme référence le groupe
   * le plus pertinent déjà existant pour la même combinaison Professeur/Matière/Niveau : en priorité
   * un groupe déjà ouvert pour l'année académique visée elle-même (le Professeur a alors déjà
   * anticipé), sinon son groupe le plus récent hors archivé (signal courant "j'accepte/je
   * n'accepte plus de nouvelles préinscriptions pour cette offre"). Si aucun groupe de référence
   * n'existe encore, les préinscriptions restent ouvertes par défaut (valeur par défaut du champ).
   */
  private async assertPreEnrollmentsOpenForTeacher(criteria: {
    teacherId: string;
    schoolLevelId: string;
    subjectId?: string;
    academicYearId: string;
  }): Promise<void> {
    const baseWhere = {
      teacherId: criteria.teacherId,
      schoolLevelId: criteria.schoolLevelId,
      status: { not: 'ARCHIVED' as const },
      ...(criteria.subjectId ? { subjectId: criteria.subjectId } : {}),
    };
    const referenceGroup =
      (await this.prisma.group.findFirst({
        where: { ...baseWhere, academicYearId: criteria.academicYearId },
        orderBy: { createdAt: 'desc' },
        select: { preEnrollmentsOpen: true },
      })) ??
      (await this.prisma.group.findFirst({
        where: baseWhere,
        orderBy: { createdAt: 'desc' },
        select: { preEnrollmentsOpen: true },
      }));
    if (referenceGroup && !referenceGroup.preEnrollmentsOpen) {
      throw new BadRequestException(
        'Les préinscriptions sont actuellement fermées par ce Professeur pour ce niveau/matière (RM-PRE-005/015, ERR-PRE-003/006)',
      );
    }
  }

  /**
   * RM-PRE-005/015, PERM-PRE-006 : le Professeur ouvre/ferme les préinscriptions sur l'un de ses
   * groupes — n'affecte jamais les inscriptions classiques sur ce même groupe.
   */
  async setPreEnrollmentsOpen(teacherId: string, groupId: string, open: boolean) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Groupe introuvable');
    }
    if (group.teacherId !== teacherId) {
      throw new ForbiddenException("Ce groupe n'appartient pas à votre compte");
    }
    return this.prisma.group.update({
      where: { id: groupId },
      data: { preEnrollmentsOpen: open },
      select: { id: true, name: true, preEnrollmentsOpen: true },
    });
  }

  /**
   * RM-CYC-025-like : Administrateurs habilités à consulter/être alertés sur les préinscriptions —
   * le Super Administrateur (accès total implicite) et tout Administrateur actif titulaire de la
   * permission `ACC_VALIDATE` (aucun code plus spécifique au domaine PRE n'existe dans ce projet,
   * même principe que `TemporalJobsService.eligibleAccountValidators`, dupliqué ici pour ne pas
   * coupler ce module à `temporal-jobs`).
   */
  private async eligibleAdminValidators(): Promise<{ id: string }[]> {
    const [superAdmins, delegatedAdmins] = await Promise.all([
      this.prisma.user.findMany({
        where: { roles: { has: 'SUPER_ADMIN' }, status: 'ACTIVE' },
        select: { id: true },
      }),
      this.prisma.administrator.findMany({
        where: { permissions: { has: 'ACC_VALIDATE' }, disabledAt: null, user: { status: 'ACTIVE' } },
        select: { id: true },
      }),
    ]);
    const ids = new Set<string>([...superAdmins.map((a) => a.id), ...delegatedAdmins.map((a) => a.id)]);
    return [...ids].map((id) => ({ id }));
  }

  /**
   * RM-PRE-027/ERR-PRE-013 : jamais bloquant — si l'élève a une situation scolaire ACTIVE dont le
   * niveau ne correspond pas à la progression naturelle (niveau visé = niveau actuel + 1) vers le
   * niveau visé par la préinscription, une alerte (priorité INFORMATION) est envoyée au Parent et
   * aux Administrateurs habilités (ACC_VALIDATE).
   */
  private async alertIfLevelProgressionIncoherent(
    pe: { id: string; parentId: string },
    studentId: string,
    targetSchoolLevelId: string,
  ): Promise<void> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        firstName: true,
        lastName: true,
        currentSchoolSituation: {
          select: { status: true, schoolLevel: { select: { order: true, name: true } } },
        },
      },
    });
    const currentLevel =
      student?.currentSchoolSituation && student.currentSchoolSituation.status === 'ACTIVE'
        ? student.currentSchoolSituation.schoolLevel
        : null;
    if (!student || !currentLevel) {
      return; // Pas de situation scolaire active connue : rien à comparer (non bloquant).
    }

    const targetLevel = await this.prisma.schoolLevel.findUnique({
      where: { id: targetSchoolLevelId },
      select: { order: true, name: true },
    });
    if (!targetLevel || targetLevel.order === currentLevel.order + 1) {
      return; // Progression naturelle (ou niveau visé introuvable) : rien à signaler.
    }

    const studentName = `${student.firstName} ${student.lastName}`;
    const body = `Le niveau "${targetLevel.name}" visé par la préinscription de ${studentName} ne correspond pas à la progression naturelle depuis son niveau actuel "${currentLevel.name}" (RM-PRE-027/ERR-PRE-013).`;

    await this.notifications.notify({
      recipientUserId: pe.parentId,
      type: 'PRE_LEVEL_PROGRESSION_MISMATCH',
      priority: 'INFORMATION',
      title: 'Niveau scolaire à vérifier',
      body,
      refType: 'PreEnrollment',
      refId: pe.id,
    });

    const admins = await this.eligibleAdminValidators();
    await Promise.all(
      admins.map((admin) =>
        this.notifications.notify({
          recipientUserId: admin.id,
          type: 'PRE_LEVEL_PROGRESSION_MISMATCH',
          priority: 'INFORMATION',
          title: 'Incohérence de progression scolaire détectée',
          body,
          refType: 'PreEnrollment',
          refId: pe.id,
        }),
      ),
    );
  }

  /**
   * Ch.11.10, RM-PRE-013/017 : pas de tâche planifiée dans ce projet — l'expiration d'une
   * proposition est constatée paresseusement, à la lecture, comme pour les autres échéances du
   * référentiel (Ch.7/Ch.9). Une préinscription EXPIREE ne peut ensuite jamais être réactivée.
   */
  private async expireIfNeeded<T extends ExpirableItem>(pe: T): Promise<T> {
    if (pe.status === 'PROPOSAL_SENT' && pe.expiresAt && pe.expiresAt < new Date()) {
      return this.prisma.preEnrollment.update({
        where: { id: pe.id },
        data: { status: 'EXPIRED' },
        include: INCLUDE_DETAILS,
      }) as unknown as Promise<T>;
    }
    return pe;
  }

  private async loadOwned(id: string) {
    const pe = await this.prisma.preEnrollment.findUnique({ where: { id }, include: INCLUDE_DETAILS });
    if (!pe) {
      throw new NotFoundException('Préinscription introuvable');
    }
    return this.expireIfNeeded(pe);
  }

  /** Ch.11.2/6.6, RM-PAR-011 : un Parent n'accède jamais aux préinscriptions d'un autre. */
  async listMineForParent(parentId: string) {
    const items = await this.prisma.preEnrollment.findMany({
      where: { parentId },
      include: INCLUDE_DETAILS,
      orderBy: { createdAt: 'desc' },
    });
    const expired = await Promise.all(items.map((item) => this.expireIfNeeded(item)));
    return expired.map((item) => this.maskGroupCapacityForParent(item));
  }

  /** L'effectif/capacité d'un groupe est une donnée privée du Professeur, jamais exposée au Parent. */
  private maskGroupCapacityForParent<T extends { proposedGroup: unknown }>(item: T): T {
    const group = item.proposedGroup as
      | ({ capacity: number; _count: { enrollments: number } } & Record<string, unknown>)
      | null;
    if (!group) return item;
    const { capacity, _count, ...publicFields } = group;
    return {
      ...item,
      proposedGroup: { ...publicFields, hasAvailableSpots: capacity - _count.enrollments > 0 },
    };
  }

  /** Ch.11.5/11.6 : le Professeur consulte ses préinscriptions reçues, filtrables par année. */
  async listMineForTeacher(teacherId: string, academicYearId?: string) {
    const items = await this.prisma.preEnrollment.findMany({
      where: { teacherId, ...(academicYearId ? { academicYearId } : {}) },
      include: INCLUDE_DETAILS,
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(items.map((item) => this.expireIfNeeded(item)));
  }

  /** Ch.11.4, RM-PRE-016/023/025, ERR-PRE-001/002/007/012 : création par le Parent. */
  async create(parentId: string, dto: CreatePreEnrollmentDto) {
    // RM-CYC-008 : un Parent dont le compte n'est pas (ou plus) ACTIVE ne peut engager aucune
    // nouvelle démarche métier.
    const parentUser = await this.prisma.user.findUnique({ where: { id: parentId }, select: { status: true } });
    if (!parentUser || parentUser.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Votre compte doit être actif pour créer une préinscription (RM-CYC-008)',
      );
    }

    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) {
      throw new NotFoundException('Élève introuvable');
    }
    if (student.parentId !== parentId) {
      throw new ForbiddenException("Cet élève n'appartient pas à votre compte (RM-PRE-016)");
    }
    if (student.status === 'ARCHIVED') {
      throw new BadRequestException('Élève archivé : création refusée (ERR-PRE-007)');
    }

    const teacher = await this.prisma.teacherProfile.findUnique({ where: { id: dto.teacherId } });
    if (!teacher || teacher.status !== 'VALIDATED') {
      throw new BadRequestException('Professeur introuvable ou non validé');
    }

    const schoolLevel = await this.prisma.schoolLevel.findUnique({ where: { id: dto.schoolLevelId } });
    if (!schoolLevel || !schoolLevel.isActive) {
      throw new BadRequestException('Niveau scolaire introuvable ou inactif');
    }

    if (dto.subjectId) {
      const subject = await this.prisma.subject.findUnique({ where: { id: dto.subjectId } });
      if (!subject || !subject.isActive) {
        throw new BadRequestException('Matière introuvable ou inactive');
      }
    }

    const academicYear = await this.prisma.academicYear.findUnique({ where: { id: dto.academicYearId } });
    if (!academicYear) {
      throw new BadRequestException('Année académique invalide (ERR-PRE-002)');
    }
    this.assertFutureAcademicYear(academicYear);

    // RM-PRE-005/015/ERR-PRE-003/006 : le Professeur a pu fermer les préinscriptions.
    await this.assertPreEnrollmentsOpenForTeacher({
      teacherId: dto.teacherId,
      schoolLevelId: dto.schoolLevelId,
      subjectId: dto.subjectId,
      academicYearId: dto.academicYearId,
    });

    // RM-PRE-025/ERR-PRE-001/012 : une seule préinscription active par élève/professeur/année.
    const duplicate = await this.prisma.preEnrollment.findFirst({
      where: {
        studentId: dto.studentId,
        teacherId: dto.teacherId,
        academicYearId: dto.academicYearId,
        status: { in: [...ACTIVE_STATUSES] },
      },
    });
    if (duplicate) {
      throw new BadRequestException(
        'Une préinscription active existe déjà pour cet élève auprès de ce professeur pour cette année (RM-PRE-025/ERR-PRE-001/012)',
      );
    }

    const created = await this.prisma.preEnrollment.create({
      data: {
        parentId,
        studentId: dto.studentId,
        teacherId: dto.teacherId,
        schoolLevelId: dto.schoolLevelId,
        subjectId: dto.subjectId,
        academicYearId: dto.academicYearId,
        status: 'PENDING',
      },
      include: INCLUDE_DETAILS,
    });

    // RM-PRE-027 : jamais bloquant, hors chemin critique de la création.
    await this.alertIfLevelProgressionIncoherent(created, dto.studentId, dto.schoolLevelId);

    return created;
  }

  /** RM-PRE-031/ERR-PRE-018 : le Parent modifie sa préinscription tant qu'aucune proposition n'a
   *  été envoyée (statut encore PENDING). */
  async update(parentId: string, id: string, dto: UpdatePreEnrollmentDto) {
    const pe = await this.loadOwned(id);
    if (pe.parentId !== parentId) {
      throw new ForbiddenException("Cette préinscription n'appartient pas à votre compte");
    }
    if (pe.status !== 'PENDING') {
      throw new BadRequestException(
        'Modification impossible : une proposition a déjà été envoyée ou traitée (RM-PRE-031/ERR-PRE-018)',
      );
    }

    const targetSchoolLevelId = dto.schoolLevelId ?? pe.schoolLevelId;
    if (dto.schoolLevelId) {
      const schoolLevel = await this.prisma.schoolLevel.findUnique({ where: { id: dto.schoolLevelId } });
      if (!schoolLevel || !schoolLevel.isActive) {
        throw new BadRequestException('Niveau scolaire introuvable ou inactif');
      }
    }
    if (dto.subjectId) {
      const subject = await this.prisma.subject.findUnique({ where: { id: dto.subjectId } });
      if (!subject || !subject.isActive) {
        throw new BadRequestException('Matière introuvable ou inactive');
      }
    }

    const updated = await this.prisma.preEnrollment.update({
      where: { id },
      data: {
        ...(dto.schoolLevelId ? { schoolLevelId: dto.schoolLevelId } : {}),
        ...(dto.subjectId ? { subjectId: dto.subjectId } : {}),
      },
      include: INCLUDE_DETAILS,
    });

    // RM-PRE-027 : la modification du niveau visé peut introduire une nouvelle incohérence.
    if (dto.schoolLevelId) {
      await this.alertIfLevelProgressionIncoherent(updated, pe.studentId, targetSchoolLevelId);
    }

    return updated;
  }

  /** RM-PRE-020/ERR-PRE-017 : annulation par le Parent, uniquement avant toute proposition. */
  async cancel(parentId: string, id: string) {
    const pe = await this.loadOwned(id);
    if (pe.parentId !== parentId) {
      throw new ForbiddenException("Cette préinscription n'appartient pas à votre compte");
    }
    if (pe.status === 'CANCELLED') {
      throw new BadRequestException('Cette préinscription est déjà annulée (ERR-PRE-017)');
    }
    if (pe.status !== 'PENDING') {
      throw new BadRequestException(
        'Annulation impossible après l’envoi d’une proposition (RM-PRE-020)',
      );
    }
    return this.prisma.preEnrollment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: INCLUDE_DETAILS,
    });
  }

  /** Ch.11.9 : le Parent refuse la proposition qui lui a été faite. */
  async reject(parentId: string, id: string) {
    const pe = await this.loadOwned(id);
    if (pe.parentId !== parentId) {
      throw new ForbiddenException("Cette préinscription n'appartient pas à votre compte");
    }
    if (pe.status !== 'PROPOSAL_SENT') {
      throw new BadRequestException('Refus impossible : aucune proposition en attente');
    }
    return this.prisma.preEnrollment.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: INCLUDE_DETAILS,
    });
  }

  /**
   * Ch.11.9/11.11, RM-PRE-011/012/021/022/024/030, ERR-PRE-004/005/011/015/016 : le Parent
   * confirme — capacité du groupe revérifiée à cet instant précis (premier arrivé/premier servi,
   * ce qui couvre la priorité chronologique RM-PRE-014 sans file d'attente formelle), et la
   * préinscription est transformée en demande d'inscription (Enrollment, PENDING_VALIDATION).
   */
  async confirm(parentId: string, id: string) {
    const pe = await this.loadOwned(id);
    if (pe.parentId !== parentId) {
      throw new ForbiddenException("Cette préinscription n'appartient pas à votre compte");
    }
    if (pe.status === 'EXPIRED') {
      throw new BadRequestException('Proposition expirée : confirmation impossible (ERR-PRE-005)');
    }
    if (pe.status !== 'PROPOSAL_SENT') {
      throw new BadRequestException('Confirmation impossible : aucune proposition en attente');
    }
    if (!pe.proposedGroupId) {
      throw new BadRequestException('Aucun groupe associé à cette proposition');
    }

    // RM-PRE-024 : la capacité de l'ABONNEMENT du Professeur est revérifiée ici, en plus de la
    // capacité du GROUPE revérifiée ci-dessous — elle a pu se réduire depuis l'envoi de la
    // proposition (ex. autres inscriptions actives entre-temps, changement d'offre).
    await this.subscriptions.assertActiveEnrollmentCapacity(pe.teacherId, 1, 'ERR-PRE-010');

    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.findUnique({
        where: { id: pe.proposedGroupId! },
        include: { _count: { select: { enrollments: true } } },
      });
      if (!group) {
        throw new BadRequestException('Groupe introuvable');
      }
      if (group.status === 'CLOSED') {
        throw new BadRequestException('Transformation impossible : groupe clôturé (ERR-PRE-015)');
      }
      if (group.status === 'ARCHIVED') {
        throw new BadRequestException('Transformation impossible : groupe archivé (ERR-PRE-016)');
      }
      if (group._count.enrollments >= group.capacity) {
        // RM-PRE-030 : la préinscription reste PROPOSAL_SENT, le Parent est informé (ERR-PRE-004/011).
        throw new BadRequestException(
          'Groupe déjà complet : transformation en demande d’inscription refusée (ERR-PRE-004/011)',
        );
      }

      await tx.enrollment.create({
        data: {
          studentId: pe.studentId,
          groupId: group.id,
          status: 'PENDING_VALIDATION',
          requestedAt: new Date(),
        },
      });

      // RM-PRE-011/012 : transformation automatique + clôture définitive de la préinscription.
      return tx.preEnrollment.update({
        where: { id },
        data: { status: 'TRANSFORMED' },
        include: INCLUDE_DETAILS,
      });
    });
  }

  /**
   * RM-PRE-026 : le Parent peut retirer sa confirmation tant que la demande d'inscription qui en
   * est issue (Enrollment PENDING_VALIDATION) n'a pas encore été traitée par le Professeur. Annule
   * cette demande — même effet que `EnrollmentsService.cancel`, réappliqué ici directement en base :
   * `EnrollmentsModule` n'exporte pas `EnrollmentsService` et est hors périmètre de ce chantier, donc
   * ce module ne peut pas l'injecter proprement — puis remet la préinscription en `PROPOSAL_SENT`
   * pour permettre une nouvelle décision du Parent (confirmer à nouveau ou refuser).
   */
  async withdrawConfirmation(parentId: string, id: string) {
    const pe = await this.loadOwned(id);
    if (pe.parentId !== parentId) {
      throw new ForbiddenException("Cette préinscription n'appartient pas à votre compte");
    }
    if (pe.status !== 'TRANSFORMED') {
      throw new BadRequestException('Aucune confirmation à retirer pour cette préinscription');
    }
    if (!pe.proposedGroupId) {
      throw new BadRequestException('Aucun groupe associé à cette préinscription');
    }

    return this.prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.findFirst({
        where: { studentId: pe.studentId, groupId: pe.proposedGroupId!, status: 'PENDING_VALIDATION' },
        orderBy: { requestedAt: 'desc' },
      });
      if (!enrollment) {
        throw new BadRequestException(
          'La demande d’inscription associée a déjà été traitée par le Professeur : retrait impossible (RM-PRE-026)',
        );
      }
      await tx.enrollment.update({ where: { id: enrollment.id }, data: { status: 'CANCELLED' } });

      return tx.preEnrollment.update({
        where: { id },
        data: { status: 'PROPOSAL_SENT' },
        include: INCLUDE_DETAILS,
      });
    });
  }

  /**
   * Ch.11.7/11.8, RM-PRE-008/009/010, ERR-PRE-008/009/014 : le Professeur envoie une proposition
   * liée à un groupe précis, compatible (même année, même niveau, et même matière si demandée).
   */
  async propose(teacherId: string, id: string, dto: ProposePreEnrollmentDto) {
    const pe = await this.loadOwned(id);
    if (pe.teacherId !== teacherId) {
      throw new ForbiddenException("Cette préinscription n'appartient pas à votre compte");
    }
    if (pe.status !== 'PENDING') {
      throw new BadRequestException(
        'Proposition impossible : cette préinscription n’est plus en attente (ERR-PRE-008/009/014)',
      );
    }

    const group = await this.prisma.group.findUnique({ where: { id: dto.groupId } });
    if (!group || group.teacherId !== teacherId) {
      throw new NotFoundException('Groupe introuvable');
    }
    const compatible =
      group.academicYearId === pe.academicYearId &&
      group.schoolLevelId === pe.schoolLevelId &&
      (!pe.subjectId || group.subjectId === pe.subjectId);
    if (!compatible) {
      throw new BadRequestException(
        'Ce groupe n’est pas compatible avec cette préinscription (même année/niveau/matière requis, RM-PRE-008)',
      );
    }

    await this.subscriptions.assertActiveEnrollmentCapacity(teacherId, 1, 'ERR-PRE-010');

    const expiresAt = new Date(dto.expiresAt);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      throw new BadRequestException('La date limite de réponse doit être dans le futur');
    }

    const updated = await this.prisma.preEnrollment.update({
      where: { id },
      data: { status: 'PROPOSAL_SENT', proposedGroupId: group.id, expiresAt },
      include: INCLUDE_DETAILS,
    });
    // NOT-PRE-* : hors chemin critique — un échec d'envoi ne doit jamais annuler la proposition.
    const proposalParentEmail = updated.parent.user.email;
    await this.notifications.notify({
      recipientUserId: updated.parentId,
      type: 'PRE_PROPOSAL_SENT',
      priority: 'IMPORTANT',
      title: 'Proposition de groupe',
      body: `Un groupe "${group.name}" a été proposé pour ${updated.student.firstName} ${updated.student.lastName} suite à votre préinscription.`,
      refType: 'PreEnrollment',
      refId: updated.id,
      sendEmail: proposalParentEmail
        ? () =>
            this.email.sendPreEnrollmentProposal(
              proposalParentEmail,
              `${updated.student.firstName} ${updated.student.lastName}`,
              group.name,
            )
        : undefined,
    });
    return updated;
  }

  /**
   * Ch.11.7/11.8, RM-PRE-008/009/010 : envoi groupé, en un clic, d'une proposition à TOUTES les
   * préinscriptions compatibles avec ce groupe — réduit la friction du parcours "une par une"
   * (RM-PRE-008/010 imposent un rapprochement/une notification automatiques que ce module ne peut
   * pas déclencher lui-même à la création du groupe, cf. rapport). Réutilise entièrement `propose()`
   * pour chaque préinscription compatible (mêmes vérifications : compatibilité, capacité
   * d'abonnement, date limite) ; un échec isolé (ex. capacité d'abonnement épuisée en cours de
   * route) n'interrompt jamais l'envoi des suivantes.
   */
  async proposeAllForGroup(teacherId: string, groupId: string, expiresAt: string) {
    const compatible = await this.listCompatibleForGroup(teacherId, groupId);
    const sent: Awaited<ReturnType<PreEnrollmentsService['propose']>>[] = [];
    const failed: { id: string; reason: string }[] = [];
    for (const pe of compatible) {
      try {
        sent.push(await this.propose(teacherId, pe.id, { groupId, expiresAt }));
      } catch (err) {
        failed.push({ id: pe.id, reason: err instanceof Error ? err.message : 'Erreur inconnue' });
      }
    }
    return { sentCount: sent.length, failedCount: failed.length, sent, failed };
  }

  /** Ch.11.7, RM-PRE-008 : préinscriptions compatibles avec un groupe (à sa création/consultation). */
  async listCompatibleForGroup(teacherId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Groupe introuvable');
    }
    if (group.teacherId !== teacherId) {
      throw new ForbiddenException("Ce groupe n'appartient pas à votre compte");
    }

    const items = await this.prisma.preEnrollment.findMany({
      where: {
        teacherId,
        status: 'PENDING',
        academicYearId: group.academicYearId,
        schoolLevelId: group.schoolLevelId,
        OR: [{ subjectId: null }, { subjectId: group.subjectId }],
      },
      include: INCLUDE_DETAILS,
      orderBy: { createdAt: 'asc' },
    });
    return Promise.all(items.map((item) => this.expireIfNeeded(item)));
  }

  /** Ch.11.4 : recherche minimale de Professeurs validés pour alimenter le formulaire du Parent
   *  (pas d'annuaire public dédié dans ce périmètre — endpoint propre à ce module, cf. rapport). */
  async listEligibleTeachers(query: EligibleTeachersQueryDto) {
    return this.prisma.teacherProfile.findMany({
      where: {
        status: 'VALIDATED',
        ...(query.city ? { city: query.city } : {}),
        ...(query.subjectId ? { subjects: { some: { subjectId: query.subjectId } } } : {}),
        ...(query.schoolLevelId ? { schoolLevels: { some: { schoolLevelId: query.schoolLevelId } } } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        city: true,
        // RM-TPR-013 : informations publiques du profil Professeur (téléphone/historique/abonnement
        // restent privés, jamais sélectionnés ici).
        bio: true,
        photo: true,
        experience: true,
        availability: true,
        teachingLocations: true,
        subjects: { include: { subject: true } },
        schoolLevels: { include: { schoolLevel: true } },
      },
      orderBy: { lastName: 'asc' },
    });
  }

  /**
   * RM-PRE-028/EVT-PRE-008 : clôture automatique de toute préinscription encore active (PENDING/
   * PROPOSAL_SENT/CONFIRMED) dont l'année académique visée est désormais entamée (`startDate <=
   * now`) sans avoir été transformée à temps — le Professeur n'a pas créé de groupe correspondant
   * avant le début de l'année. Appelée depuis `TemporalJobsService.runDailyCron()` (ce module ne
   * dépend d'aucune brique de scheduling). Idempotente par construction : seules les lignes encore
   * dans un statut actif sont sélectionnées, une exécution répétée ne referme jamais deux fois la
   * même ligne — la notification (NOT-PRE-008) et sa déduplication via `markOnce` restent du ressort
   * de l'appelant, comme pour les autres jobs de ce fichier.
   */
  async closeStaleForOpenedAcademicYear(
    now = new Date(),
  ): Promise<{ id: string; teacherId: string; academicYearLabel: string }[]> {
    const stale = await this.prisma.preEnrollment.findMany({
      where: {
        status: { in: [...ACTIVE_STATUSES] },
        academicYear: { startDate: { lte: now } },
      },
      select: { id: true, teacherId: true, academicYear: { select: { label: true } } },
    });
    if (stale.length === 0) {
      return [];
    }

    await this.prisma.preEnrollment.updateMany({
      where: { id: { in: stale.map((s) => s.id) } },
      data: { status: 'CLOSED' },
    });

    return stale.map((s) => ({ id: s.id, teacherId: s.teacherId, academicYearLabel: s.academicYear.label }));
  }

  /** RM-PRE-029 : consultation Administrateur de l'ensemble des préinscriptions, filtrable par
   *  statut et année académique (ACC_VALIDATE, cf. controller). */
  async listAllForAdmin(query: AdminListPreEnrollmentsQueryDto) {
    return this.prisma.preEnrollment.findMany({
      where: {
        ...(query.status ? { status: query.status as PreEnrollmentStatus } : {}),
        ...(query.academicYearId ? { academicYearId: query.academicYearId } : {}),
      },
      include: INCLUDE_DETAILS,
      orderBy: { createdAt: 'desc' },
    });
  }
}
