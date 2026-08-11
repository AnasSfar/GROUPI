import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { GroupStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { SearchGroupsQueryDto } from './dto/search-groups-query.dto';
import { PauseGenerationDto } from './dto/pause-generation.dto';
import { DuplicateGroupDto } from './dto/duplicate-group.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

/**
 * RM-GRP-024 : signature order-independent d'un planning (jour+heure+durée), utilisée pour
 * détecter un planning strictement identique entre deux groupes du même Professeur.
 */
function scheduleSignature(
  schedules: { dayOfWeek: string; startTime: string; durationMinutes: number }[],
): string {
  return schedules
    .map((s) => `${s.dayOfWeek}|${s.startTime}|${s.durationMinutes}`)
    .sort()
    .join(';');
}

const INCLUDE_DETAILS = {
  subject: true,
  schoolLevel: true,
  academicYear: true,
  // RM-TPR-013 : bio/photo/expérience/lieux d'enseignement/disponibilités sont des informations
  // publiques du profil Professeur — exposées ici pour que la recherche de groupe côté Parent
  // (search(), plus bas) les affiche. Téléphone/historique/abonnement restent privés (jamais
  // sélectionnés).
  teacher: {
    select: {
      firstName: true,
      lastName: true,
      city: true,
      bio: true,
      photo: true,
      experience: true,
      availability: true,
      teachingLocations: true,
    },
  },
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
    // RM-TPR-005/007 : la création de groupe ne dépend plus du statut global du profil (qui pouvait
    // à tort redevenir "en attente" pour l'ensemble des matières/niveaux à cause d'un seul ajout
    // récent) mais du fait que le compte a déjà été validé au moins une fois (User.status ACTIVE)
    // ET que le Professeur dispose d'au moins une matière ET un niveau validés ligne par ligne
    // (TeacherSubject/TeacherSchoolLevel.isValidated — cf. teacher-profile.service.ts).
    const teacherProfile = await this.prisma.teacherProfile.findUnique({
      where: { id: teacherId },
      include: { user: { select: { status: true } } },
    });
    if (!teacherProfile || teacherProfile.user.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Professeur non validé : création de groupe impossible (ERR-GRP-002/ERR-GRP-018)',
      );
    }
    const [validatedSubjectCount, validatedLevelCount] = await Promise.all([
      this.prisma.teacherSubject.count({ where: { teacherProfileId: teacherId, isValidated: true } }),
      this.prisma.teacherSchoolLevel.count({ where: { teacherProfileId: teacherId, isValidated: true } }),
    ]);
    if (validatedSubjectCount === 0 || validatedLevelCount === 0) {
      throw new BadRequestException(
        'Le Professeur doit disposer d’au moins une matière et un niveau validés pour créer un groupe (RM-TPR-007/ERR-GRP-002)',
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
    await this.assertNoDuplicateSchedule(
      teacherId,
      dto.subjectId,
      dto.schoolLevelId,
      dto.academicYearId,
      dto.schedules,
    );

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
          // RM-GRP-007 : `null` = hérite du mode d'enseignement du groupe.
          teachingMode: s.teachingMode ?? null,
        })),
      });

      // RM-ACC-019/020 : traçabilité centralisée de la création d'un groupe.
      await tx.auditLog.create({
        data: {
          userId: teacherId,
          action: 'GROUP_CREATED',
          targetType: 'Group',
          targetId: group.id,
          newValues: {
            name: group.name,
            status: group.status,
            subjectId: group.subjectId,
            schoolLevelId: group.schoolLevelId,
            academicYearId: group.academicYearId,
            capacity: group.capacity,
          },
        },
      });

      return tx.group.findUniqueOrThrow({
        where: { id: group.id },
        include: { ...INCLUDE_DETAILS, _count: { select: { enrollments: true } } },
      });
    });
  }

  /**
   * Ch.10.11/RM-GRP-015/027/037/EVT-GRP-014 : duplication d'un groupe — crée un nouveau groupe
   * indépendant (nouvel id), statut de départ DRAFT, en copiant tous les paramètres du groupe
   * source (matière, niveau, tarif, mode, politique de facturation, seuils, planning/créneaux).
   * Ne reprend JAMAIS les élèves, présences, paiements, commentaires ou séances déjà générées.
   * Matière et niveau sont toujours ceux du groupe source ; seule l'année académique peut être
   * explicitement choisie si elle diffère (ERR-GRP-011 si le groupe source est archivé).
   */
  async duplicate(teacherId: string, groupId: string, dto: DuplicateGroupDto) {
    const source = await this.loadOwned(teacherId, groupId);
    if (source.status === 'ARCHIVED') {
      throw new BadRequestException('Duplication d’un groupe archivé impossible (ERR-GRP-011)');
    }

    const academicYearId = dto.academicYearId ?? source.academicYearId;
    if (dto.academicYearId && dto.academicYearId !== source.academicYearId) {
      const academicYear = await this.prisma.academicYear.findUnique({
        where: { id: academicYearId },
      });
      if (!academicYear || academicYear.status !== 'OPEN') {
        throw new BadRequestException('Année académique fermée (ERR-GRP-008)');
      }
    }

    // RM-GRP-005/006 : la combinaison matière/niveau du groupe source pourrait ne plus être
    // autorisée depuis sa création — revérifiée avant toute duplication.
    const subjectLevel = await this.prisma.subjectLevel.findUnique({
      where: {
        subjectId_schoolLevelId: { subjectId: source.subjectId, schoolLevelId: source.schoolLevelId },
      },
    });
    if (!subjectLevel || !subjectLevel.isAllowed || !subjectLevel.isActive) {
      throw new BadRequestException('Combinaison matière/niveau interdite (ERR-GRP-001)');
    }

    await this.subscriptions.assertActiveEnrollmentCapacity(teacherId, source.capacity, 'ERR-GRP-013');

    const name = dto.name?.trim() || `${source.name} (copie)`;
    const duplicateName = await this.prisma.group.findFirst({ where: { teacherId, name } });
    if (duplicateName) {
      throw new BadRequestException('Nom déjà utilisé par ce professeur (ERR-GRP-004)');
    }

    const scheduleInputs = source.schedules.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      durationMinutes: s.durationMinutes,
      teachingLocationId: s.teachingLocationId ?? undefined,
    }));
    await this.assertLocationsOwned(teacherId, scheduleInputs);
    await this.assertNoDuplicateSchedule(
      teacherId,
      source.subjectId,
      source.schoolLevelId,
      academicYearId,
      scheduleInputs,
    );

    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          teacherId,
          subjectId: source.subjectId,
          schoolLevelId: source.schoolLevelId,
          academicYearId,
          name,
          capacity: source.capacity,
          publicPrice: source.publicPrice,
          teachingMode: source.teachingMode,
          absenceBillingPolicy: source.absenceBillingPolicy,
          abandonmentThreshold: source.abandonmentThreshold,
          debtAlertThresholdSessions: source.debtAlertThresholdSessions,
          visibilityWhenFull: source.visibilityWhenFull,
          startDate: source.startDate,
          endDate: source.endDate ?? undefined,
          status: 'DRAFT',
        },
      });

      // RM-GRP-015 : jamais les élèves, présences, paiements, commentaires ou séances déjà
      // générées — seul le planning hebdomadaire (créneaux récurrents) est repris.
      await tx.groupSchedule.createMany({
        data: source.schedules.map((s) => ({
          groupId: group.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          durationMinutes: s.durationMinutes,
          teachingLocationId: s.teachingLocationId,
          teachingMode: s.teachingMode,
        })),
      });

      // RM-ACC-019/020 : traçabilité centralisée de la duplication (EVT-GRP-014).
      await tx.auditLog.create({
        data: {
          userId: teacherId,
          action: 'GROUP_DUPLICATED',
          targetType: 'Group',
          targetId: group.id,
          oldValues: { sourceGroupId: source.id, sourceName: source.name },
          newValues: { name: group.name, status: group.status, academicYearId },
        },
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

  /**
   * RM-GRP-024 : un Professeur ne peut pas avoir simultanément deux groupes actifs
   * (DRAFT/ACTIVE/FULL) avec la même matière, le même niveau, la même année académique et un
   * planning hebdomadaire strictement identique (mêmes créneaux : jour+heure+durée).
   */
  private async assertNoDuplicateSchedule(
    teacherId: string,
    subjectId: string,
    schoolLevelId: string,
    academicYearId: string,
    schedules: { dayOfWeek: string; startTime: string; durationMinutes: number }[],
  ) {
    const candidates = await this.prisma.group.findMany({
      where: {
        teacherId,
        subjectId,
        schoolLevelId,
        academicYearId,
        status: { in: ['DRAFT', 'ACTIVE', 'FULL'] },
      },
      select: {
        schedules: { select: { dayOfWeek: true, startTime: true, durationMinutes: true } },
      },
    });
    const signature = scheduleSignature(schedules);
    const isDuplicate = candidates.some((g) => scheduleSignature(g.schedules) === signature);
    if (isDuplicate) {
      throw new BadRequestException(
        'Un groupe actif avec la même matière, le même niveau, la même année académique et un planning identique existe déjà (RM-GRP-024)',
      );
    }
  }

  /**
   * Ch.10.11/RM-GRP-016 : matière/niveau/année académique restent modifiables tant qu'aucune
   * inscription n'existe encore pour ce groupe (ERR-GRP-009 sinon) — voir UpdateGroupDto.
   */
  async update(teacherId: string, groupId: string, dto: UpdateGroupDto) {
    const group = await this.loadOwned(teacherId, groupId);
    if (group.status === 'ARCHIVED') {
      throw new BadRequestException('Groupe archivé : modification impossible (ERR-GRP-010)');
    }

    if (dto.endDate && new Date(dto.endDate) < group.startDate) {
      throw new BadRequestException('Date de fin antérieure à la date de début (ERR-GRP-021)');
    }

    // RM-GRP-016 : matière/niveau/année ne redeviennent verrouillés qu'à la 1ère inscription (tout
    // statut confondu) — au-delà, toute tentative de modification est refusée (ERR-GRP-009).
    const wantsToChangeReferential =
      dto.subjectId !== undefined || dto.schoolLevelId !== undefined || dto.academicYearId !== undefined;
    let nextSubjectId = group.subjectId;
    let nextSchoolLevelId = group.schoolLevelId;
    if (wantsToChangeReferential) {
      const enrollmentCount = await this.prisma.enrollment.count({ where: { groupId } });
      if (enrollmentCount > 0) {
        throw new BadRequestException(
          'Modification de la matière/du niveau/de l’année académique interdite : ce groupe a déjà reçu au moins une inscription (ERR-GRP-009/RM-GRP-016)',
        );
      }

      nextSubjectId = dto.subjectId ?? group.subjectId;
      nextSchoolLevelId = dto.schoolLevelId ?? group.schoolLevelId;
      if (dto.subjectId !== undefined || dto.schoolLevelId !== undefined) {
        const subjectLevel = await this.prisma.subjectLevel.findUnique({
          where: {
            subjectId_schoolLevelId: { subjectId: nextSubjectId, schoolLevelId: nextSchoolLevelId },
          },
        });
        if (!subjectLevel || !subjectLevel.isAllowed || !subjectLevel.isActive) {
          throw new BadRequestException('Combinaison matière/niveau interdite (ERR-GRP-001)');
        }
      }
      if (dto.academicYearId !== undefined && dto.academicYearId !== group.academicYearId) {
        const academicYear = await this.prisma.academicYear.findUnique({
          where: { id: dto.academicYearId },
        });
        if (!academicYear || academicYear.status !== 'OPEN') {
          throw new BadRequestException('Année académique fermée (ERR-GRP-008)');
        }
      }
    }

    // RM-GRP-025 : la capacité ne peut jamais être réduite sous le nombre d'élèves déjà inscrits
    // (statut ACTIVE).
    if (dto.capacity !== undefined) {
      const activeEnrollments = await this.prisma.enrollment.count({
        where: { groupId, status: 'ACTIVE' },
      });
      if (dto.capacity < activeEnrollments) {
        throw new BadRequestException(
          `Capacité (${dto.capacity}) inférieure au nombre d’élèves déjà inscrits (${activeEnrollments}) (RM-GRP-025)`,
        );
      }
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

    // RM-GRP-039 : historisation des modifications de groupe — on ne capture que les champs
    // effectivement fournis ET dont la valeur change réellement par rapport à l'état courant.
    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};
    if (dto.name !== undefined && dto.name !== group.name) {
      oldValues.name = group.name;
      newValues.name = dto.name;
    }
    if (dto.subjectId !== undefined && dto.subjectId !== group.subjectId) {
      oldValues.subjectId = group.subjectId;
      newValues.subjectId = dto.subjectId;
    }
    if (dto.schoolLevelId !== undefined && dto.schoolLevelId !== group.schoolLevelId) {
      oldValues.schoolLevelId = group.schoolLevelId;
      newValues.schoolLevelId = dto.schoolLevelId;
    }
    if (dto.academicYearId !== undefined && dto.academicYearId !== group.academicYearId) {
      oldValues.academicYearId = group.academicYearId;
      newValues.academicYearId = dto.academicYearId;
    }
    if (dto.capacity !== undefined && dto.capacity !== group.capacity) {
      oldValues.capacity = group.capacity;
      newValues.capacity = dto.capacity;
    }
    if (dto.publicPrice !== undefined && Number(group.publicPrice) !== dto.publicPrice) {
      oldValues.publicPrice = group.publicPrice.toString();
      newValues.publicPrice = dto.publicPrice;
    }
    if (dto.absenceBillingPolicy !== undefined && dto.absenceBillingPolicy !== group.absenceBillingPolicy) {
      oldValues.absenceBillingPolicy = group.absenceBillingPolicy;
      newValues.absenceBillingPolicy = dto.absenceBillingPolicy;
    }
    if (dto.abandonmentThreshold !== undefined && dto.abandonmentThreshold !== group.abandonmentThreshold) {
      oldValues.abandonmentThreshold = group.abandonmentThreshold;
      newValues.abandonmentThreshold = dto.abandonmentThreshold;
    }
    if (
      dto.debtAlertThresholdSessions !== undefined &&
      dto.debtAlertThresholdSessions !== group.debtAlertThresholdSessions
    ) {
      oldValues.debtAlertThresholdSessions = group.debtAlertThresholdSessions;
      newValues.debtAlertThresholdSessions = dto.debtAlertThresholdSessions;
    }
    if (dto.visibilityWhenFull !== undefined && dto.visibilityWhenFull !== group.visibilityWhenFull) {
      oldValues.visibilityWhenFull = group.visibilityWhenFull;
      newValues.visibilityWhenFull = dto.visibilityWhenFull;
    }
    if (dto.endDate !== undefined) {
      const newEndDate = new Date(dto.endDate).toISOString();
      const oldEndDate = group.endDate ? group.endDate.toISOString() : null;
      if (newEndDate !== oldEndDate) {
        oldValues.endDate = oldEndDate;
        newValues.endDate = newEndDate;
      }
    }
    if (dto.schedules) {
      oldValues.schedules = group.schedules.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        durationMinutes: s.durationMinutes,
        teachingLocationId: s.teachingLocationId,
        teachingMode: s.teachingMode,
      }));
      newValues.schedules = dto.schedules;
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.group.update({
        where: { id: groupId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.subjectId !== undefined ? { subjectId: dto.subjectId } : {}),
          ...(dto.schoolLevelId !== undefined ? { schoolLevelId: dto.schoolLevelId } : {}),
          ...(dto.academicYearId !== undefined ? { academicYearId: dto.academicYearId } : {}),
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
            // RM-GRP-007 : `null` = hérite du mode d'enseignement du groupe.
            teachingMode: s.teachingMode ?? null,
          })),
        });

        // ERR-GRP-017 : "supprimer" = purge des séances futures obsolètes pour qu'elles soient
        // régénérées depuis le nouveau planning (voir SessionsService.generate) — on ne
        // régénère jamais nous-mêmes ici, on se contente de ne pas laisser de séances périmées.
        if (dto.keepFutureSessions === false && futureSessionIds.length > 0) {
          await tx.session.deleteMany({ where: { id: { in: futureSessionIds } } });
        }
      }

      // RM-GRP-039/RM-ACC-019/020 : traçabilité de toute modification importante du groupe —
      // journalisation uniquement si au moins un champ a effectivement changé.
      if (Object.keys(newValues).length > 0) {
        await tx.auditLog.create({
          data: {
            userId: teacherId,
            action: 'GROUP_UPDATED',
            targetType: 'Group',
            targetId: groupId,
            oldValues: oldValues as Prisma.InputJsonValue,
            newValues: newValues as Prisma.InputJsonValue,
          },
        });
      }

      return tx.group.findUniqueOrThrow({
        where: { id: groupId },
        include: { ...INCLUDE_DETAILS, _count: { select: { enrollments: true } } },
      });
    });
  }

  /**
   * RM-GRP-009/030 : interruption temporaire de la génération automatique des séances — ne modifie
   * jamais le planning hebdomadaire ni les inscriptions actives. `from`/`until` sont indépendants ;
   * passer `null` efface la borne correspondante (jusqu'à annuler complètement la pause).
   */
  async pauseGeneration(teacherId: string, groupId: string, dto: PauseGenerationDto) {
    const group = await this.loadOwned(teacherId, groupId);
    if (group.status === 'ARCHIVED') {
      throw new BadRequestException('Groupe archivé : modification impossible (ERR-GRP-010)');
    }

    const nextFrom =
      dto.from !== undefined ? (dto.from ? new Date(dto.from) : null) : group.generationPausedFrom;
    const nextUntil =
      dto.until !== undefined ? (dto.until ? new Date(dto.until) : null) : group.generationPausedUntil;

    if (nextFrom && nextUntil && nextFrom > nextUntil) {
      throw new BadRequestException(
        'La date de début de la pause doit précéder (ou égaler) la date de fin (RM-GRP-009)',
      );
    }

    const updated = await this.prisma.group.update({
      where: { id: groupId },
      data: { generationPausedFrom: nextFrom, generationPausedUntil: nextUntil },
      include: { ...INCLUDE_DETAILS, _count: { select: { enrollments: true } } },
    });

    // RM-GRP-039/RM-ACC-019/020 : traçabilité — pas de transaction Prisma existante ici, donc
    // journalisation best-effort, non bloquante.
    await this.prisma.auditLog.create({
      data: {
        userId: teacherId,
        action: 'GROUP_GENERATION_PAUSE_UPDATED',
        targetType: 'Group',
        targetId: groupId,
        oldValues: {
          generationPausedFrom: group.generationPausedFrom,
          generationPausedUntil: group.generationPausedUntil,
        },
        newValues: { generationPausedFrom: nextFrom, generationPausedUntil: nextUntil },
      },
    });

    return updated;
  }

  /**
   * RM-GRP-009/030 : indique si `date` tombe dans la période d'interruption temporaire de la
   * génération de séances configurée sur ce groupe (bornes inclusives ; une borne non renseignée
   * est considérée ouverte de ce côté-là). Méthode publique destinée à être appelée par
   * `SessionsService` (module Séances) dans sa boucle de génération pour sauter les dates
   * concernées — la reprise après la pause n'est jamais rétroactive : aucune séance sautée n'est
   * générée a posteriori une fois la période de pause passée.
   */
  isDateInGenerationPause(
    group: { generationPausedFrom: Date | null; generationPausedUntil: Date | null },
    date: Date,
  ): boolean {
    const { generationPausedFrom, generationPausedUntil } = group;
    if (!generationPausedFrom && !generationPausedUntil) return false;
    if (generationPausedFrom && date < generationPausedFrom) return false;
    if (generationPausedUntil && date > generationPausedUntil) return false;
    return true;
  }

  private async transition(teacherId: string, groupId: string, toStatus: GroupStatus) {
    const group = await this.loadOwned(teacherId, groupId);
    const allowed = ALLOWED_TRANSITIONS[group.status] ?? [];
    if (!allowed.includes(toStatus)) {
      throw new BadRequestException(`Transition interdite : ${group.status} -> ${toStatus}`);
    }
    const updated = await this.prisma.group.update({
      where: { id: groupId },
      data: { status: toStatus },
      include: { ...INCLUDE_DETAILS, _count: { select: { enrollments: true } } },
    });

    if (toStatus === 'CLOSED') {
      // RM-ACC-019/020 : traçabilité de la clôture — pas de transaction Prisma existante ici
      // (simple mise à jour), donc journalisation best-effort, non bloquante.
      await this.prisma.auditLog.create({
        data: {
          userId: teacherId,
          action: 'GROUP_CLOSED',
          targetType: 'Group',
          targetId: groupId,
          oldValues: { status: group.status },
          newValues: { status: toStatus },
        },
      });
    }

    return updated;
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

      // RM-ACC-019/020 : traçabilité centralisée de l'archivage d'un groupe.
      await tx.auditLog.create({
        data: {
          userId: teacherId,
          action: 'GROUP_ARCHIVED',
          targetType: 'Group',
          targetId: groupId,
          oldValues: { status: group.status },
          newValues: { status: 'ARCHIVED', autoRejectedEnrollments: pending.length },
        },
      });

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

    // RM-ACC-019/020 : traçabilité de la suppression — pas de transaction Prisma existante ici,
    // journalisation best-effort, non bloquante.
    await this.prisma.auditLog.create({
      data: {
        userId: teacherId,
        action: 'GROUP_DELETED',
        targetType: 'Group',
        targetId: groupId,
        oldValues: { name: group.name, status: group.status },
      },
    });

    return { id: groupId, deleted: true };
  }

  /** Ch.10.5/10.6 : recherche publique par les Parents — champs publics uniquement. */
  async search(parentId: string, query: SearchGroupsQueryDto) {
    const students = await this.prisma.student.findMany({
      where: {
        parentId,
        status: 'ACTIVE',
        currentSchoolSituation: { is: { status: 'ACTIVE' } },
      },
      select: { currentSchoolSituation: { select: { schoolLevelId: true } } },
    });
    const allowedSchoolLevelIds = [
      ...new Set(students.map((s) => s.currentSchoolSituation?.schoolLevelId).filter(Boolean)),
    ] as string[];

    if (allowedSchoolLevelIds.length === 0) {
      return [];
    }
    if (query.schoolLevelId && !allowedSchoolLevelIds.includes(query.schoolLevelId)) {
      return [];
    }

    const groups = await this.prisma.group.findMany({
      where: {
        status: { in: ['ACTIVE', 'FULL'] },
        ...(query.subjectId ? { subjectId: query.subjectId } : {}),
        schoolLevelId: query.schoolLevelId ?? { in: allowedSchoolLevelIds },
        // RM-INS-007 : mode d'enseignement et nom du Professeur, en plus des filtres déjà existants.
        ...(query.teachingMode ? { teachingMode: query.teachingMode } : {}),
        teacher: {
          status: 'VALIDATED',
          user: { status: 'ACTIVE' },
          ...(query.city ? { city: query.city } : {}),
          ...(query.teacherName
            ? {
                OR: [
                  { firstName: { contains: query.teacherName, mode: 'insensitive' } },
                  { lastName: { contains: query.teacherName, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
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
