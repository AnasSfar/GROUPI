import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { GroupStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { SearchGroupsQueryDto } from './dto/search-groups-query.dto';

const INCLUDE_DETAILS = {
  subject: true,
  schoolLevel: true,
  academicYear: true,
  teacher: { select: { firstName: true, lastName: true, city: true } },
  schedules: { include: { teachingLocation: true } },
} as const;

/** Ch.10.12 : seules ces transitions manuelles sont exposées (COMPLET est automatique, dépend des inscriptions). */
const ALLOWED_TRANSITIONS: Record<GroupStatus, GroupStatus[]> = {
  DRAFT: ['ACTIVE'],
  ACTIVE: ['FULL', 'CLOSED'],
  FULL: ['ACTIVE', 'CLOSED'],
  SUSPENDED: [],
  CLOSED: ['ARCHIVED'],
  ARCHIVED: [],
};

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

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

  archive(teacherId: string, groupId: string) {
    return this.transition(teacherId, groupId, 'ARCHIVED');
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
        capacity: g.capacity,
        spotsAvailable: Math.max(0, g.capacity - g._count.enrollments),
        status: g.status,
        schedules: g.schedules,
        startDate: g.startDate,
        endDate: g.endDate,
      }));
  }
}
