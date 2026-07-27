import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AcademicYear } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePreEnrollmentDto } from './dto/create-pre-enrollment.dto';
import { ProposePreEnrollmentDto } from './dto/propose-pre-enrollment.dto';
import { EligibleTeachersQueryDto } from './dto/eligible-teachers-query.dto';

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
    return Promise.all(items.map((item) => this.expireIfNeeded(item)));
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

    return this.prisma.preEnrollment.create({
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
    await this.notifications.notify({
      recipientUserId: updated.parentId,
      type: 'PRE_PROPOSAL_SENT',
      priority: 'IMPORTANT',
      title: 'Proposition de groupe',
      body: `Un groupe "${group.name}" a été proposé pour ${updated.student.firstName} ${updated.student.lastName} suite à votre préinscription.`,
      refType: 'PreEnrollment',
      refId: updated.id,
      sendEmail: () =>
        this.email.sendPreEnrollmentProposal(
          updated.parent.user.email,
          `${updated.student.firstName} ${updated.student.lastName}`,
          group.name,
        ),
    });
    return updated;
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
        subjects: { include: { subject: true } },
        schoolLevels: { include: { schoolLevel: true } },
      },
      orderBy: { lastName: 'asc' },
    });
  }
}
