import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Group, LevelPoolMembership, MembershipSource, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

type Tx = Prisma.TransactionClient;

/**
 * Avenant 01, Ch. B — groupes de niveau (salles d'attente) : conteneur technique créé et archivé
 * exclusivement par GROUPI (RM-POOL-001/006, ERR-POOL-006), jamais par le Professeur. Un groupe de
 * niveau n'a ni matière, ni planning, ni tarif, ni capacité limitée, ni compte de suivi comptable
 * (RM-POOL-002/003) — les champs `teachingMode`/`absenceBillingPolicy`/`visibilityWhenFull` du
 * modèle `Group` (non NULLABLE en base) reçoivent donc des valeurs arbitraires jamais exploitées
 * (aucun planning ni séance n'est jamais généré pour `kind = LEVEL_POOL`).
 */
@Injectable()
export class LevelPoolsService {
  private readonly logger = new Logger(LevelPoolsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * RM-POOL-001/006, B.3 : au plus un groupe de niveau par (Professeur, niveau, année académique) —
   * garanti par l'index unique partiel `group_level_pool_teacher_level_year_key` (migration
   * avenant01). Idempotent : si le groupe existe déjà, le retourne tel quel (le réactive s'il avait
   * été archivé faute d'utilisation, RM-POOL-012, et que le niveau redevient enseigné).
   */
  async ensureGroupForValidatedLevel(
    teacherId: string,
    schoolLevelId: string,
    academicYearId: string,
    tx: Tx | PrismaService = this.prisma,
  ): Promise<Group> {
    const existing = await tx.group.findFirst({
      where: { teacherId, schoolLevelId, academicYearId, kind: 'LEVEL_POOL' },
    });
    if (existing) {
      if (existing.status === 'ARCHIVED') {
        return tx.group.update({ where: { id: existing.id }, data: { status: 'ACTIVE' } });
      }
      return existing;
    }

    const [schoolLevel, academicYear] = await Promise.all([
      tx.schoolLevel.findUniqueOrThrow({ where: { id: schoolLevelId } }),
      tx.academicYear.findUniqueOrThrow({ where: { id: academicYearId } }),
    ]);

    const created = await tx.group.create({
      data: {
        teacherId,
        subjectId: null,
        schoolLevelId,
        academicYearId,
        kind: 'LEVEL_POOL',
        // Ch. B.1/§0.3 : terminologie officielle "Salle d'attente <niveau>" — jamais montré comme
        // "groupe" côté Parent (RM-POOL-009/010) ; sert de libellé interne pour le Professeur.
        name: `Salle d'attente ${schoolLevel.name}`,
        capacity: 0, // RM-POOL-003 : capacité illimitée (0 = pas de limite pour ce kind, jamais consommée).
        publicPrice: 0,
        // Valeurs jamais exploitées pour ce kind (RM-POOL-002) — aucun planning/séance/tarif.
        teachingMode: 'PRESENTIAL',
        absenceBillingPolicy: 'NONE_BILLED',
        visibilityWhenFull: 'HIDDEN',
        startDate: academicYear.startDate,
        endDate: academicYear.endDate,
        status: 'ACTIVE',
      },
    });

    await tx.auditLog.create({
      data: {
        action: 'LEVEL_POOL_GROUP_CREATED',
        targetType: 'Group',
        targetId: created.id,
        newValues: { teacherId, schoolLevelId, academicYearId, kind: 'LEVEL_POOL' },
      },
    });

    return created;
  }

  /** B.3 : à la validation d'un `TeacherSchoolLevel`, crée le groupe de niveau pour chaque année
   *  académique `OPEN` (plusieurs années peuvent cohabiter, cf. `SubscriptionsService.assertCanWrite`). */
  async ensureGroupsForValidatedLevel(teacherId: string, schoolLevelId: string): Promise<Group[]> {
    const openYears = await this.prisma.academicYear.findMany({ where: { status: 'OPEN' } });
    const groups: Group[] = [];
    for (const year of openYears) {
      groups.push(await this.ensureGroupForValidatedLevel(teacherId, schoolLevelId, year.id));
    }
    return groups;
  }

  /**
   * RM-INV-006/B.3 : à l'ouverture d'une nouvelle année académique, crée les groupes de niveau
   * manquants pour chaque couple (Professeur, niveau enseigné validé) déjà connu.
   */
  async ensureGroupsForNewAcademicYear(academicYearId: string): Promise<{ created: number }> {
    const validatedLevels = await this.prisma.teacherSchoolLevel.findMany({
      where: { isValidated: true },
      select: { teacherProfileId: true, schoolLevelId: true },
    });
    let created = 0;
    for (const { teacherProfileId, schoolLevelId } of validatedLevels) {
      const before = await this.prisma.group.count({
        where: { teacherId: teacherProfileId, schoolLevelId, academicYearId, kind: 'LEVEL_POOL' },
      });
      await this.ensureGroupForValidatedLevel(teacherProfileId, schoolLevelId, academicYearId);
      if (before === 0) created++;
    }
    return { created };
  }

  private async loadOwnedPool(teacherId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group || group.kind !== 'LEVEL_POOL') {
      throw new NotFoundException('Salle d’attente introuvable');
    }
    if (group.teacherId !== teacherId) {
      throw new ForbiddenException("Cette salle d'attente n'appartient pas à votre compte");
    }
    return group;
  }

  /** RM-POOL-005, ERR-POOL-001/002/003 : le rattachement exige une situation scolaire ACTIVE de
   *  l'élève, au niveau et à l'année académique du groupe de niveau visé. */
  private async assertAttachable(studentId: string, schoolLevelId: string, academicYearId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { currentSchoolSituation: true },
    });
    if (!student) {
      throw new NotFoundException('Élève introuvable');
    }
    if (student.status === 'ARCHIVED') {
      throw new BadRequestException('Élève archivé : rattachement impossible (ERR-POOL-003)');
    }
    const situation = student.currentSchoolSituation;
    if (!situation || situation.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Aucune situation scolaire active pour cet élève : rattachement impossible (ERR-POOL-001)',
      );
    }
    if (situation.academicYearId !== academicYearId || situation.schoolLevelId !== schoolLevelId) {
      throw new BadRequestException(
        "Le niveau/l'année académique de la situation scolaire active ne correspond pas au groupe de niveau visé (ERR-POOL-002)",
      );
    }
    return student;
  }

  /**
   * RM-POOL-004/005, A.3.3 : rattache un élève au groupe de niveau (Professeur, niveau, année) —
   * idempotent par élève (RM-INV-014/ERR-INV-007 : un élève déjà rattaché, `ACTIVE`, n'est jamais
   * rattaché une seconde fois, aucune erreur). Un rattachement `REMOVED` est réactivé plutôt que
   * dupliqué (contrainte `@@unique([studentId, groupId])`).
   */
  async attachStudent(params: {
    studentId: string;
    teacherId: string;
    schoolLevelId: string;
    academicYearId: string;
    source: MembershipSource;
    invitationId?: string;
  }): Promise<{ membership: LevelPoolMembership; created: boolean }> {
    const { studentId, teacherId, schoolLevelId, academicYearId, source, invitationId } = params;
    await this.assertAttachable(studentId, schoolLevelId, academicYearId);

    const group = await this.prisma.group.findFirst({
      where: { teacherId, schoolLevelId, academicYearId, kind: 'LEVEL_POOL' },
    });
    if (!group) {
      // Le niveau n'est pas (encore) un niveau enseigné validé de ce Professeur — RM-INV-013 gère ce
      // cas côté appelant (ParentInvitationsService) avant même d'appeler cette méthode.
      throw new BadRequestException(
        "Ce Professeur ne dispose pas encore d'un groupe de niveau pour ce niveau scolaire",
      );
    }

    const existing = await this.prisma.levelPoolMembership.findUnique({
      where: { studentId_groupId: { studentId, groupId: group.id } },
    });
    if (existing) {
      if (existing.status === 'ACTIVE') {
        return { membership: existing, created: false }; // RM-INV-014/ERR-INV-007 : idempotent.
      }
      const reactivated = await this.prisma.levelPoolMembership.update({
        where: { id: existing.id },
        data: { status: 'ACTIVE', source, invitationId: invitationId ?? null, removedAt: null, removedById: null },
      });
      await this.notifyNewMember(teacherId, group, studentId, source);
      return { membership: reactivated, created: true };
    }

    const membership = await this.prisma.levelPoolMembership.create({
      data: { studentId, groupId: group.id, status: 'ACTIVE', source, invitationId },
    });
    await this.prisma.auditLog.create({
      data: {
        action: 'LEVEL_POOL_MEMBERSHIP_CREATED',
        targetType: 'LevelPoolMembership',
        targetId: membership.id,
        newValues: { studentId, groupId: group.id, source, invitationId },
      },
    });
    await this.notifyNewMember(teacherId, group, studentId, source);
    return { membership, created: true };
  }

  /**
   * NOT-POOL-001 : "Nouvel élève dans votre salle d'attente <niveau>". Le cas `source = INVITATION`
   * est notifié par `ParentInvitationsService` lui-même via NOT-INV-002 (libellé propre au Ch. A) —
   * jamais les deux à la fois pour un même événement.
   */
  private async notifyNewMember(
    teacherId: string,
    group: Group,
    studentId: string,
    source: MembershipSource,
  ): Promise<void> {
    if (source === 'INVITATION') return;
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { firstName: true, lastName: true },
    });
    await this.notifications.notify({
      recipientUserId: teacherId,
      type: 'POOL_NEW_STUDENT',
      priority: 'IMPORTANT',
      title: 'Nouvel élève en salle d’attente',
      body: `${student?.firstName ?? ''} ${student?.lastName ?? ''} a rejoint votre salle d'attente "${group.name}".`,
      refType: 'Group',
      refId: group.id,
    });
  }

  /** Mes salles d'attente, groupées par niveau (RM-POOL-009 : jamais mêlées aux groupes standard). */
  async listMineGroupedByLevel(teacherId: string) {
    const groups = await this.prisma.group.findMany({
      where: { teacherId, kind: 'LEVEL_POOL' },
      include: {
        schoolLevel: true,
        academicYear: true,
        _count: { select: { levelPoolMemberships: { where: { status: 'ACTIVE' } } } },
      },
      orderBy: { schoolLevel: { order: 'asc' } },
    });
    return groups.map((g) => ({
      id: g.id,
      schoolLevel: g.schoolLevel,
      academicYear: g.academicYear,
      status: g.status,
      activeMemberCount: g._count.levelPoolMemberships,
    }));
  }

  /** Ch. B : liste des élèves rattachés (ACTIVE) d'une salle d'attente donnée. */
  async listMembers(teacherId: string, groupId: string) {
    const group = await this.loadOwnedPool(teacherId, groupId);
    const memberships = await this.prisma.levelPoolMembership.findMany({
      where: { groupId: group.id, status: 'ACTIVE' },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
            currentSchoolSituation: { select: { schoolLevelId: true, school: { select: { name: true } }, class: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return memberships;
  }

  /**
   * RM-POOL-007, ERR-POOL-004 : le retrait est toujours autorisé, y compris si l'élève a une
   * inscription active dans un groupe standard de ce Professeur (avertissement, jamais bloquant —
   * l'inscription active n'est jamais affectée, RM-POOL-008). Jamais de suppression physique
   * (`status -> REMOVED`), en particulier si ce rattachement a déjà servi de source à une affectation.
   */
  async removeMember(teacherId: string, groupId: string, studentId: string, actorUserId: string) {
    const group = await this.loadOwnedPool(teacherId, groupId);
    const membership = await this.prisma.levelPoolMembership.findUnique({
      where: { studentId_groupId: { studentId, groupId: group.id } },
    });
    if (!membership || membership.status !== 'ACTIVE') {
      throw new NotFoundException('Rattachement introuvable ou déjà retiré');
    }

    const hasActiveStandardEnrollment = await this.prisma.enrollment.findFirst({
      where: { studentId, status: 'ACTIVE', group: { teacherId, kind: 'STANDARD' } },
      select: { id: true },
    });

    const updated = await this.prisma.levelPoolMembership.update({
      where: { id: membership.id },
      data: { status: 'REMOVED', removedAt: new Date(), removedById: actorUserId },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorUserId,
        action: 'LEVEL_POOL_MEMBERSHIP_REMOVED',
        targetType: 'LevelPoolMembership',
        targetId: membership.id,
        oldValues: { status: 'ACTIVE' },
        newValues: { status: 'REMOVED', hadActiveStandardEnrollment: !!hasActiveStandardEnrollment },
      },
    });

    return {
      ...updated,
      // ERR-POOL-004 : signalé au Professeur, l'inscription active reste intacte (RM-POOL-008).
      warning: hasActiveStandardEnrollment
        ? "Cet élève a une inscription active dans un de vos groupes standard : elle n'est pas affectée par ce retrait (ERR-POOL-004)."
        : null,
    };
  }

  /** RM-AFF-002/ERR-AFF-001 : réutilisé par le module d'affectation (Ch. C). */
  async findActiveMembership(studentId: string, teacherId: string, schoolLevelId: string, academicYearId: string) {
    const group = await this.prisma.group.findFirst({
      where: { teacherId, schoolLevelId, academicYearId, kind: 'LEVEL_POOL' },
    });
    if (!group) return null;
    return this.prisma.levelPoolMembership.findUnique({
      where: { studentId_groupId: { studentId, groupId: group.id } },
    });
  }
}
