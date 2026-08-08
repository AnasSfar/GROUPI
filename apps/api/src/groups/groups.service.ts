import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { GroupStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { SearchGroupsQueryDto } from './dto/search-groups-query.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

const INCLUDE_DETAILS = {
  subject: true,
  schoolLevel: true,
  academicYear: true,
  teacher: { select: { firstName: true, lastName: true, city: true } },
  schedules: { include: { teachingLocation: true } },
} as const;

/**
 * Ch.10.12 : seules ces transitions manuelles sont exposées (COMPLET est automatique, dépend des
 * inscriptions). `ARCHIVED -> CLOSED` déroge sciemment à ERR-GRP-010/RM-GRP-017 (« archivé » est
 * documenté comme un état terminal immuable) — activé à la demande explicite du Professeur, qui a
 * été prévenu que les demandes d'inscription auto-rejetées lors de l'archivage (ERR-INS-029/031)
 * ne sont pas restaurées par cette réactivation.
 */
const ALLOWED_TRANSITIONS: Record<GroupStatus, GroupStatus[]> = {
  DRAFT: ['ACTIVE'],
  ACTIVE: ['FULL', 'CLOSED'],
  FULL: ['ACTIVE', 'CLOSED'],
  SUSPENDED: [],
  CLOSED: ['ARCHIVED'],
  ARCHIVED: ['CLOSED'],
};

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionsService,
    private readonly notifications: NotificationsService,
  ) {}

  private async loadOwned(teacherId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { ...INCLUDE_DETAILS, _count: { select: { enrollments: true } } },
    });
    if (!group) {
      throw new NotFoundException('Groupe introuvable');
    }
    if (group.teacherId !== teacherId) {
      throw new ForbiddenException("Ce groupe n'appartient pas à votre compte");
    }
    return group;
  }

  async listMine(teacherId: string) {
    return this.prisma.group.findMany({
      where: { teacherId },
      include: { ...INCLUDE_DETAILS, _count: { select: { enrollments: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(teacherId: string, groupId: string) {
    return this.loadOwned(teacherId, groupId);
  }

  /** Ch.10.2/10.3 : création d'un groupe — vérifications ERR-GRP-001/002/004/006/007/008/021. */
  async create(teacherId: string, dto: CreateGroupDto) {
    const teacherProfile = await this.prisma.teacherProfile.findUnique({
      where: { id: teacherId },
    });
    if (!teacherProfile || teacherProfile.status !== 'VALIDATED') {
      throw new BadRequestException(
        'Professeur non validé : création de groupe impossible (ERR-GRP-002/ERR-GRP-018)',
      );
    }

    const subjectLevel = await this.prisma.subjectLevel.findUnique({
      where: { subjectId_schoolLevelId: { subjectId: dto.subjectId, schoolLevelId: dto.schoolLevelId } },
    });
    if (!subjectLevel || !subjectLevel.isAllowed || !subjectLevel.isActive) {
      throw new BadRequestException('Combinaison matière/niveau interdite (ERR-GRP-001)');
    }

    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id: dto.academicYearId },
    });
    if (!academicYear || academicYear.status !== 'OPEN') {
      throw new BadRequestException('Année académique fermée (ERR-GRP-008)');
    }

    if (dto.endDate && new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException('Date de fin antérieure à la date de début (ERR-GRP-021)');
    }


    await this.subscriptions.assertActiveEnrollmentCapacity(teacherId, dto.capacity, 'ERR-GRP-013');
    const duplicateName = await this.prisma.group.findFirst({
      where: { teacherId, name: dto.name },
    });
    if (duplicateName) {
      throw new BadRequestException('Nom déjà utilisé par ce professeur (ERR-GRP-004)');
    }

    await this.assertLocationsOwned(teacherId, dto.schedules);

    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          teacherId,
          subjectId: dto.subjectId,
          schoolLevelId: dto.schoolLevelId,
          academicYearId: dto.academicYearId,
          name: dto.name,
          capacity: dto.capacity,
          publicPrice: dto.publicPrice,
          teachingMode: dto.teachingMode,
          absenceBillingPolicy: dto.absenceBillingPolicy,
          abandonmentThreshold: dto.abandonmentThreshold ?? 3,
          debtAlertThresholdSessions: dto.debtAlertThresholdSessions ?? 4,
          visibilityWhenFull: dto.visibilityWhenFull,
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          status: 'DRAFT',
        },
      });

      await tx.groupSchedule.createMany({
        data: dto.schedules.map((s) => ({
          groupId: group.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          durationMinutes: s.durationMinutes,
          teachingLocationId: s.teachingLocationId,
        })),
      });

      return tx.group.findUniqueOrThrow({
        where: { id: group.id },
        include: { ...INCLUDE_DETAILS, _count: { select: { enrollments: true } } },
      });
    });
  }

  private async assertLocationsOwned(
    teacherId: string,
    schedules: { teachingLocationId?: string }[],
  ) {
    const locationIds = [...new Set(schedules.map((s) => s.teachingLocationId).filter(Boolean))] as string[];
    if (locationIds.length === 0) return;
    const count = await this.prisma.teachingLocation.count({
      where: { id: { in: locationIds }, teacherId },
    });
    if (count !== locationIds.length) {
      throw new BadRequestException('Lieu d’enseignement inexistant (ERR-GRP-005)');
    }
  }

  /** Ch.10.11 : matière/niveau/année ne sont jamais modifiables après création dans cette version. */
  async update(teacherId: string, groupId: string, dto: UpdateGroupDto) {
    const group = await this.loadOwned(teacherId, groupId);
    if (group.status === 'ARCHIVED') {
      throw new BadRequestException('Groupe archivé : modification impossible (ERR-GRP-010)');
    }

    if (dto.endDate && new Date(dto.endDate) < group.startDate) {
      throw new BadRequestException('Date de fin antérieure à la date de début (ERR-GRP-021)');
    }

    if (dto.schedules) {
      await this.assertLocationsOwned(teacherId, dto.schedules);
    }

    // ERR-GRP-016/017 : une modification de planning ne doit jamais faire disparaître ou dériver
    // silencieusement des séances futures déjà planifiées. On identifie d'abord ces séances ;
    // si l'appelant n'a pas explicitement choisi quoi en faire, l'opération est refusée.
    let futureSessionIds: string[] = [];
    if (dto.schedules) {
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const futureSessions = await this.prisma.session.findMany({
        where: {
          groupId,
          date: { gte: today },
          status: { in: ['PLANNED', 'POSTPONED'] },
        },
        select: { id: true },
      });
      futureSessionIds = futureSessions.map((s) => s.id);

      if (futureSessionIds.length > 0 && dto.keepFutureSessions === undefined) {
        throw new BadRequestException(
          `${futureSessionIds.length} séance(s) future(s) déjà planifiée(s) pour ce groupe : ` +
            'précisez keepFutureSessions (true = conserver, false = supprimer et régénérer) avant de modifier le planning (ERR-GRP-016/ERR-GRP-017)',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.group.update({
        where: { id: groupId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
          ...(dto.publicPrice !== undefined ? { publicPrice: dto.publicPrice } : {}),
          ...(dto.absenceBillingPolicy !== undefined
            ? { absenceBillingPolicy: dto.absenceBillingPolicy }
            : {}),
          ...(dto.abandonmentThreshold !== undefined
            ? { abandonmentThreshold: dto.abandonmentThreshold }
            : {}),
          ...(dto.debtAlertThresholdSessions !== undefined
            ? { debtAlertThresholdSessions: dto.debtAlertThresholdSessions }
            : {}),
          ...(dto.visibilityWhenFull !== undefined
            ? { visibilityWhenFull: dto.visibilityWhenFull }
            : {}),
          ...(dto.endDate !== undefined ? { endDate: new Date(dto.endDate) } : {}),
        },
      });

      if (dto.schedules) {
        await tx.groupSchedule.deleteMany({ where: { groupId } });
        await tx.groupSchedule.createMany({
          data: dto.schedules.map((s) => ({
            groupId,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            durationMinutes: s.durationMinutes,
            teachingLocationId: s.teachingLocationId,
          })),
        });

        // ERR-GRP-017 : "supprimer" = purge des séances futures obsolètes pour qu'elles soient
        // régénérées depuis le nouveau planning (voir SessionsService.generate) — on ne
        // régénère jamais nous-mêmes ici, on se contente de ne pas laisser de séances périmées.
        if (dto.keepFutureSessions === false && futureSessionIds.length > 0) {
          await tx.session.deleteMany({ where: { id: { in: futureSessionIds } } });
        }
      }

      return tx.group.findUniqueOrThrow({
        where: { id: groupId },
        include: { ...INCLUDE_DETAILS, _count: { select: { enrollments: true } } },
      });
    });
  }

  private async transition(teacherId: string, groupId: string, toStatus: GroupStatus) {
    const group = await this.loadOwned(teacherId, groupId);
    const allowed = ALLOWED_TRANSITIONS[group.status] ?? [];
    if (!allowed.includes(toStatus)) {
      throw new BadRequestException(`Transition interdite : ${group.status} -> ${toStatus}`);
    }
    return this.prisma.group.update({
      where: { id: groupId },
      data: { status: toStatus },
      include: { ...INCLUDE_DETAILS, _count: { select: { enrollments: true } } },
    });
  }

  open(teacherId: string, groupId: string) {
    return this.transition(teacherId, groupId, 'ACTIVE');
  }

  close(teacherId: string, groupId: string) {
    return this.transition(teacherId, groupId, 'CLOSED');
  }

  /** Réactivation d'un groupe archivé — voir la note sur `ALLOWED_TRANSITIONS` ci-dessus. */
  reactivate(teacherId: string, groupId: string) {
    return this.transition(teacherId, groupId, 'CLOSED');
  }

  /**
   * ERR-INS-029/031 : un groupe archivé ne peut plus recevoir de décision — toute demande encore
   * PENDING_VALIDATION est automatiquement clôturée (REJECTED, sans décideur) et le Parent en est
   * informé. Cascade appliquée dans la même transaction que le changement de statut du groupe.
   */
  async archive(teacherId: string, groupId: string) {
    const group = await this.loadOwned(teacherId, groupId);
    const allowed = ALLOWED_TRANSITIONS[group.status] ?? [];
    if (!allowed.includes('ARCHIVED')) {
      throw new BadRequestException(`Transition interdite : ${group.status} -> ARCHIVED`);
    }

    const { updatedGroup, autoClosed } = await this.prisma.$transaction(async (tx) => {
      const updatedGroup = await tx.group.update({
        where: { id: groupId },
        data: { status: 'ARCHIVED' },
        include: { ...INCLUDE_DETAILS, _count: { select: { enrollments: true } } },
      });

      const pending = await tx.enrollment.findMany({
        where: { groupId, status: 'PENDING_VALIDATION' },
        include: { student: true },
      });

      for (const enrollment of pending) {
        await tx.enrollment.update({
          where: { id: enrollment.id },
          data: { status: 'REJECTED', decidedAt: new Date(), decidedById: null },
        });
      }

      return { updatedGroup, autoClosed: pending };
    });

    // NOT-INS : hors transaction — un échec d'envoi ne doit jamais annuler l'archivage.
    for (const enrollment of autoClosed) {
      await this.notifications.notify({
        recipientUserId: enrollment.student.parentId,
        type: 'INS_AUTO_CLOSED_GROUP_ARCHIVED',
        priority: 'IMPORTANT',
        title: 'Demande d’inscription automatiquement clôturée',
        body: `Le groupe "${updatedGroup.name}" a été archivé par le Professeur : la demande d'inscription de ${enrollment.student.firstName} ${enrollment.student.lastName} a été automatiquement clôturée (ERR-INS-029/031).`,
        refType: 'Enrollment',
        refId: enrollment.id,
      });
    }

    return updatedGroup;
  }

  /** ERR-GRP-020 : jamais de suppression physique dès qu'un historique existe. */
  async remove(teacherId: string, groupId: string) {
    const group = await this.loadOwned(teacherId, groupId);
    if (group.status !== 'DRAFT' || group._count.enrollments > 0) {
      throw new BadRequestException(
        'Suppression refusée : ce groupe possède un historique (ERR-GRP-020)',
      );
    }
    await this.prisma.groupSchedule.deleteMany({ where: { groupId } });
    await this.prisma.group.delete({ where: { id: groupId } });
    return { id: groupId, deleted: true };
  }

  /** Ch.10.5/10.6 : recherche publique par les Parents — champs publics uniquement. */
  async search(query: SearchGroupsQueryDto) {
    const groups = await this.prisma.group.findMany({
      where: {
        status: { in: ['ACTIVE', 'FULL'] },
        ...(query.subjectId ? { subjectId: query.subjectId } : {}),
        ...(query.schoolLevelId ? { schoolLevelId: query.schoolLevelId } : {}),
        ...(query.city ? { teacher: { city: query.city } } : {}),
      },
      include: { ...INCLUDE_DETAILS, _count: { select: { enrollments: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return groups
      .filter((g) => g.status === 'ACTIVE' || g.visibilityWhenFull === 'VISIBLE')
      .map((g) => ({
        id: g.id,
        name: g.name,
        subject: g.subject,
        schoolLevel: g.schoolLevel,
        academicYear: g.academicYear,
        teacher: g.teacher,
        publicPrice: g.publicPrice,
        teachingMode: g.teachingMode,
        absenceBillingPolicy: g.absenceBillingPolicy,
        hasAvailableSpots: g._count.enrollments < g.capacity,
        status: g.status,
        schedules: g.schedules,
        startDate: g.startDate,
        endDate: g.endDate,
      }));
  }
}
