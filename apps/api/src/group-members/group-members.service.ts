import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AccountingService } from '../accounting/accounting.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { LevelPoolsService } from '../level-pools/level-pools.service';
import { SessionsService } from '../sessions/sessions.service';
import { AssignGroupMembersDto } from './dto/assign-group-members.dto';

export interface AssignOutcome {
  studentId: string;
  status: 'ASSIGNED' | 'SKIPPED';
  reason?: string;
  enrollmentId?: string;
}

const BLOCKED_GROUP_STATUSES = new Set(['DRAFT', 'CLOSED', 'ARCHIVED', 'SUSPENDED']);

/**
 * Avenant 01, Ch. C — affectation d'un élève de la salle d'attente vers un groupe standard
 * (RM-AFF-*). Remplace, pour ce chemin, le tunnel « demande d'inscription à l'initiative du
 * Parent » (Ch. 12.3-12.7 supprimés côté C.4) : c'est désormais le Professeur qui crée directement
 * l'Inscription `ACTIVE`.
 */
@Injectable()
export class GroupMembersService {
  private readonly logger = new Logger(GroupMembersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly accounting: AccountingService,
    private readonly subscriptions: SubscriptionsService,
    private readonly levelPools: LevelPoolsService,
    private readonly sessions: SessionsService,
  ) {}

  private async loadOwnedStandardGroup(teacherId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { academicYear: true, subject: true },
    });
    if (!group) {
      throw new NotFoundException('Groupe introuvable');
    }
    if (group.teacherId !== teacherId) {
      throw new ForbiddenException("Ce groupe n'appartient pas à votre compte");
    }
    if (group.kind !== 'STANDARD') {
      // RM-POOL-009 : un groupe de niveau n'est jamais une cible d'affectation.
      throw new BadRequestException("Ce groupe est une salle d'attente : impossible d'y affecter un élève");
    }
    return group;
  }

  /**
   * Ch. C.3, RM-AFF-001→010, ERR-AFF-001→008 : affectation multi-élèves, tout-ou-rien PAR élève
   * (RM-AFF-008) — un échec isolé n'interrompt jamais le traitement des suivants (même schéma que
   * `PreEnrollmentsService.proposeAllForGroup`).
   */
  async assign(teacherId: string, groupId: string, dto: AssignGroupMembersDto) {
    const group = await this.loadOwnedStandardGroup(teacherId, groupId);

    // ERR-AFF-005 : groupe cible fermé/suspendu/archivé — refus global, avant même d'examiner les élèves.
    if (BLOCKED_GROUP_STATUSES.has(group.status)) {
      throw new BadRequestException(
        `Groupe cible ${group.status.toLowerCase()} : affectation impossible (ERR-AFF-005)`,
      );
    }
    // ERR-AFF-007 : année académique clôturée — refus global.
    if (group.academicYear.status !== 'OPEN') {
      throw new BadRequestException("Année académique clôturée : affectation impossible (ERR-AFF-007)");
    }

    const assigned: AssignOutcome[] = [];
    const skipped: AssignOutcome[] = [];

    for (const studentId of dto.studentIds) {
      try {
        const outcome = await this.assignOne(teacherId, group, studentId, dto);
        (outcome.status === 'ASSIGNED' ? assigned : skipped).push(outcome);
      } catch (err) {
        skipped.push({
          studentId,
          status: 'SKIPPED',
          reason: err instanceof Error ? err.message : 'Erreur inconnue',
        });
      }
    }

    if (assigned.length > 0) {
      // RM-AFF-005 : génère les séances futures du groupe désormais non vide — même mécanisme que
      // Ch.13 (`SessionsService.generate`), jamais bloquant pour la réponse de l'affectation.
      try {
        await this.sessions.generate(teacherId, groupId);
      } catch (err) {
        this.logger.warn(
          `Génération des séances suspendue après affectation sur le groupe ${groupId} : ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    // NOT-AFF-003/EVT-AFF-002 : récapitulatif au Professeur.
    await this.notifications.notify({
      recipientUserId: teacherId,
      type: 'AFF_SUMMARY',
      priority: 'INFORMATION',
      title: 'Affectation traitée',
      body: `${assigned.length} élève(s) inscrit(s) au groupe "${group.name}"${
        skipped.length > 0 ? `, ${skipped.length} refusé(s)` : ''
      }.`,
      refType: 'Group',
      refId: group.id,
    });

    return { assigned, skipped };
  }

  private async assignOne(
    teacherId: string,
    group: { id: string; capacity: number; schoolLevelId: string; academicYearId: string; publicPrice: unknown; name: string },
    studentId: string,
    dto: AssignGroupMembersDto,
  ): Promise<AssignOutcome> {
    // ERR-AFF-004 : déjà inscrit activement — ignoré (pas un échec).
    const existingActive = await this.prisma.enrollment.findFirst({
      where: { studentId, groupId: group.id, status: 'ACTIVE' },
    });
    if (existingActive) {
      return { studentId, status: 'SKIPPED', reason: 'Déjà inscrit activement dans ce groupe (ERR-AFF-004)' };
    }

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { currentSchoolSituation: true },
    });
    if (!student || student.status === 'ARCHIVED') {
      return { studentId, status: 'SKIPPED', reason: 'Élève introuvable ou archivé' };
    }
    const situation = student.currentSchoolSituation;
    // ERR-AFF-006 : niveau du groupe cible != situation scolaire active de l'élève.
    if (
      !situation ||
      situation.status !== 'ACTIVE' ||
      situation.schoolLevelId !== group.schoolLevelId ||
      situation.academicYearId !== group.academicYearId
    ) {
      return {
        studentId,
        status: 'SKIPPED',
        reason: "La situation scolaire active de l'élève ne correspond pas au groupe cible (ERR-AFF-006)",
      };
    }

    // RM-AFF-002/ERR-AFF-001 : l'élève doit être rattaché au groupe de niveau du même Professeur.
    const membership = await this.levelPools.findActiveMembership(
      studentId,
      teacherId,
      group.schoolLevelId,
      group.academicYearId,
    );
    if (!membership || membership.status !== 'ACTIVE') {
      return {
        studentId,
        status: 'SKIPPED',
        reason: "Élève non rattaché au groupe de niveau de ce Professeur (ERR-AFF-001)",
      };
    }

    // ERR-AFF-002 : capacité du groupe (recalculée à chaque élève traité).
    const activeCount = await this.prisma.enrollment.count({ where: { groupId: group.id, status: 'ACTIVE' } });
    if (activeCount >= group.capacity) {
      return { studentId, status: 'SKIPPED', reason: 'Groupe complet (ERR-AFF-002)' };
    }

    // ERR-AFF-003/RM-AFF-004 : capacité d'abonnement du Professeur.
    try {
      await this.subscriptions.assertActiveEnrollmentCapacity(teacherId, 1, 'ERR-AFF-003');
    } catch (err) {
      return {
        studentId,
        status: 'SKIPPED',
        reason: err instanceof Error ? err.message : "Capacité d'abonnement atteinte (ERR-AFF-003)",
      };
    }

    const customPrice = dto.customPrice ?? Number(group.publicPrice);

    const { enrollment } = await this.prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.create({
        data: {
          studentId,
          groupId: group.id,
          status: 'ACTIVE',
          origin: 'TEACHER_ASSIGNMENT',
          sourceMembershipId: membership.id,
          customPrice,
          paymentMethod: dto.paymentMethod,
          requestedAt: new Date(),
          decidedAt: new Date(),
          decidedById: teacherId,
        },
      });

      // RM-AFF-005/RM-CPT-002 : compte de suivi comptable créé automatiquement, comme à l'acceptation
      // d'une inscription classique.
      await this.accounting.createAccountForEnrollment(tx, enrollment.id, group.academicYearId);

      const becameFull = activeCount + 1 >= group.capacity;
      if (becameFull) {
        await tx.group.update({ where: { id: group.id }, data: { status: 'FULL' } });
      }

      await tx.auditLog.create({
        data: {
          userId: teacherId,
          action: 'GROUP_MEMBER_ASSIGNED',
          targetType: 'Enrollment',
          targetId: enrollment.id,
          newValues: { studentId, groupId: group.id, sourceMembershipId: membership.id },
        },
      });

      return { enrollment };
    });

    // NOT-AFF-001 : hors transaction — un échec de notification ne doit jamais annuler l'affectation.
    await this.notifications.notify({
      recipientUserId: student.parentId,
      type: 'AFF_ASSIGNED',
      priority: 'IMPORTANT',
      title: 'Inscription au groupe',
      body: `${student.firstName} ${student.lastName} a été inscrit·e au groupe "${group.name}".`,
      refType: 'Enrollment',
      refId: enrollment.id,
    });

    return { studentId, status: 'ASSIGNED', enrollmentId: enrollment.id };
  }

  /** RM-AFF-009 : retirer un élève d'un groupe standard = archiver son inscription. */
  async remove(teacherId: string, groupId: string, studentId: string) {
    const group = await this.loadOwnedStandardGroup(teacherId, groupId);
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId, groupId: group.id, status: { in: ['ACTIVE', 'SUSPENDED'] } },
      include: { student: true },
    });
    if (!enrollment) {
      throw new NotFoundException("Aucune inscription active ou suspendue pour cet élève dans ce groupe");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.enrollment.update({ where: { id: enrollment.id }, data: { status: 'ARCHIVED' } });
      if (enrollment.status === 'ACTIVE') {
        const current = await tx.group.findUniqueOrThrow({ where: { id: group.id } });
        if (current.status === 'FULL') {
          const activeCount = await tx.enrollment.count({ where: { groupId: group.id, status: 'ACTIVE' } });
          if (activeCount < current.capacity) {
            await tx.group.update({ where: { id: group.id }, data: { status: 'ACTIVE' } });
          }
        }
      }
      await tx.auditLog.create({
        data: {
          userId: teacherId,
          action: 'GROUP_MEMBER_REMOVED',
          targetType: 'Enrollment',
          targetId: enrollment.id,
          oldValues: { status: enrollment.status },
          newValues: { status: 'ARCHIVED' },
        },
      });
    });

    // NOT-AFF-002 : le Parent est informé du retrait.
    await this.notifications.notify({
      recipientUserId: enrollment.student.parentId,
      type: 'AFF_REMOVED',
      priority: 'IMPORTANT',
      title: 'Retrait d’un groupe',
      body: `${enrollment.student.firstName} ${enrollment.student.lastName} a été retiré·e du groupe "${group.name}".`,
      refType: 'Enrollment',
      refId: enrollment.id,
    });

    return this.prisma.enrollment.findUniqueOrThrow({ where: { id: enrollment.id } });
  }
}
