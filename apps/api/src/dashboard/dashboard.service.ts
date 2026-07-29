import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityPriority } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';
import { AttendanceService } from '../attendance/attendance.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { theoreticalStart } from '../sessions/sessions.service';

function dateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function todayDateOnly(): Date {
  return dateOnly(new Date());
}

export interface DashboardAlert {
  level: 'CRITICAL' | 'IMPORTANT' | 'INFORMATION';
  code: string;
  message: string;
  refType?: string;
  refId?: string;
}

/** Ch.16.8 : niveaux du référentiel (Critique/Importante/Informative) mappés sur `ActivityPriority`
 *  (CRITICAL/IMPORTANT/INFORMATION) — même enum que le centre d'activités du Ch.18, pas de doublon. */
function toAlertLevel(priority: ActivityPriority): DashboardAlert['level'] {
  return priority;
}

/** Seuils d'occupation non spécifiés par le référentiel — assumés (voir progress.md). */
const NEARLY_FULL_RATIO = 0.8;
const NEEDS_STUDENTS_RATIO = 0.5;
/** Fenêtre d'alerte "abonnement arrivant à échéance" — non chiffrée par le référentiel (RM-DSH-010),
 *  alignée sur le délai de grâce de 7 jours (Ch.22) + une marge, assumée elle aussi. */
const SUBSCRIPTION_EXPIRY_WARNING_DAYS = 15;

/**
 * Ch.16 : agrégation en lecture seule des tableaux de bord par rôle. Aucune donnée n'est stockée
 * ici (RM-DSH-013/RM-CPT-031, même principe que le reste du projet) — tout est recalculé à chaque
 * appel à partir des domaines existants, en réutilisant leurs services plutôt qu'en recalculant des
 * soldes/indicateurs déjà définis ailleurs (AccountingService, AttendanceService, SubscriptionsService).
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounting: AccountingService,
    private readonly attendance: AttendanceService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  // ===============================================================================================
  // Professeur (Ch.16.3)
  // ===============================================================================================

  async getTeacherDashboard(teacherId: string) {
    const today = todayDateOnly();

    const groups = await this.prisma.group.findMany({
      where: { teacherId },
      include: {
        subject: { select: { name: true } },
        schoolLevel: { select: { name: true } },
        enrollments: { where: { status: 'ACTIVE' }, select: { id: true, studentId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const groupIds = groups.map((g) => g.id);
    const activeStudentIds = new Set(groups.flatMap((g) => g.enrollments.map((e) => e.studentId)));

    const groupsView = groups.map((g) => {
      const activeCount = g.enrollments.length;
      const occupancyRate = g.capacity > 0 ? activeCount / g.capacity : 0;
      const isOpenish = g.status === 'ACTIVE' || g.status === 'FULL';
      let category: 'FULL' | 'NEARLY_FULL' | 'NEEDS_STUDENTS' | 'NORMAL' | 'OTHER' = 'OTHER';
      if (isOpenish) {
        if (g.status === 'FULL' || activeCount >= g.capacity) category = 'FULL';
        else if (occupancyRate >= NEARLY_FULL_RATIO) category = 'NEARLY_FULL';
        else if (occupancyRate < NEEDS_STUDENTS_RATIO) category = 'NEEDS_STUDENTS';
        else category = 'NORMAL';
      }
      return {
        id: g.id,
        name: g.name,
        subject: g.subject.name,
        schoolLevel: g.schoolLevel.name,
        status: g.status,
        capacity: g.capacity,
        activeCount,
        occupancyRate: Math.round(occupancyRate * 1000) / 1000,
        category,
      };
    });

    const [todaysSessions, upcomingSessions, pendingEnrollmentsCount, pendingGroupChangesCount] = await Promise.all([
      this.prisma.session.findMany({
        where: { groupId: { in: groupIds }, date: today },
        include: { group: { select: { id: true, name: true } } },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.session.findMany({
        where: { groupId: { in: groupIds }, status: 'PLANNED', date: { gt: today } },
        include: { group: { select: { id: true, name: true } } },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        take: 10,
      }),
      this.prisma.enrollment.count({ where: { status: 'PENDING_VALIDATION', groupId: { in: groupIds } } }),
      this.prisma.groupChangeRequest.count({ where: { status: 'PENDING', targetGroupId: { in: groupIds } } }),
    ]);

    const activity = {
      activeGroupsCount: groups.filter((g) => g.status === 'ACTIVE' || g.status === 'FULL').length,
      totalActiveStudents: activeStudentIds.size,
      todaysSessions: todaysSessions.map((s) => this.sessionSummary(s)),
      upcomingSessions: upcomingSessions.map((s) => this.sessionSummary(s)),
      pendingEnrollmentsCount,
      pendingGroupChangesCount,
    };

    // --- Présences (Ch.16.3) --------------------------------------------------------------------
    const todaysAttendance = await this.prisma.attendance.findMany({
      where: { sessionId: { in: todaysSessions.map((s) => s.id) } },
    });
    const abandonmentAlerts = (
      await Promise.all(
        groups
          .filter((g) => g.status === 'ACTIVE' || g.status === 'FULL')
          .map(async (g) => {
            const alerts = await this.attendance.getAbandonmentAlerts(teacherId, g.id);
            return alerts.map((a) => ({ ...a, groupId: g.id, groupName: g.name }));
          }),
      )
    ).flat();

    const presences = {
      absencesToday: todaysAttendance.filter((a) => a.status === 'EXCUSED_ABSENT' || a.status === 'UNEXCUSED_ABSENT')
        .length,
      latesToday: todaysAttendance.filter((a) => a.status === 'LATE').length,
      // Ch.16.3 : "élèves fréquemment absents" et "alertes d'abandon" partagent la même définition
      // (seuil `Group.abandonmentThreshold`) — dédupliqué comme les autres doublons du référentiel
      // (voir NOT-CPT-006/010 dans progress.md).
      frequentlyAbsentStudents: abandonmentAlerts,
      abandonmentAlerts,
    };

    // --- Comptabilité / Paiements (Ch.16.3, réutilise AccountingService — RM-CPT-031) -----------
    const [accountingIndicators, debtorAccounts, recentPayments] = await Promise.all([
      this.accounting.getTeacherIndicators(teacherId),
      this.accounting.listDebtorAccounts(teacherId, 10),
      this.accounting.listRecentPayments(teacherId, 10),
    ]);
    const payments = {
      debtorAccounts,
      negativeBalanceAccounts: debtorAccounts,
      recentPayments,
    };

    // --- Profil (Ch.16.3) ------------------------------------------------------------------------
    const profile = await this.prisma.teacherProfile.findUniqueOrThrow({
      where: { id: teacherId },
      include: { user: { select: { status: true } } },
    });
    const missingProfileFields = [
      !profile.photo && 'photo',
      !profile.bio && 'bio',
      !profile.experience && 'experience',
    ].filter((v): v is string => Boolean(v));
    const profileView = {
      completenessScore: profile.completenessScore,
      missingFields: missingProfileFields,
      profileStatus: profile.status,
      accountStatus: profile.user.status,
      pendingAdminValidation: profile.status === 'PENDING_VALIDATION' || profile.user.status === 'PENDING_VALIDATION',
    };

    // --- Abonnement (droits liés, Ch.22) / Statistiques + Export (RM-DSH-011/012) ----------------
    const subs = await this.subscriptions.listMine(teacherId);
    const hasPaidActiveSubscription = subs.some((s) => s.status === 'ACTIVE' && !s.plan.isTrial);
    const statistics = hasPaidActiveSubscription
      ? await this.buildTeacherStatistics(groupIds, groups.length, activeStudentIds.size, accountingIndicators)
      : {
          available: false,
          message:
            "Statistiques avancées disponibles à partir de l'offre Intermédiaire (RM-DSH-011) : passez à une offre supérieure pour les débloquer.",
        };
    // Ch.17 (export PDF/Excel) est un autre chantier — voir progress.md : seul le point
    // d'intégration (disponibilité selon abonnement) est exposé ici, pas la génération de fichier.
    const exportInfo = {
      available: hasPaidActiveSubscription,
      message: hasPaidActiveSubscription
        ? undefined
        : "L'offre Découverte ne permet pas l'export du tableau de bord (RM-DSH-012).",
      // TODO(Ch.17) : brancher ici la génération réelle (PDF/Excel/CSV) une fois le module Export livré.
    };

    // --- Préinscriptions (Ch.16.3) ----------------------------------------------------------------
    const preEnrollments = await this.prisma.preEnrollment.findMany({
      where: { teacherId },
      select: {
        status: true,
        schoolLevel: { select: { name: true } },
        subject: { select: { name: true } },
      },
    });
    const preEnrollmentsView = {
      receivedCount: preEnrollments.length,
      pendingCount: preEnrollments.filter((p) => p.status === 'PENDING').length,
      mostRequestedLevels: this.topCounts(preEnrollments.map((p) => p.schoolLevel.name)),
      mostRequestedSubjects: this.topCounts(
        preEnrollments.map((p) => p.subject?.name).filter((v): v is string => Boolean(v)),
      ),
    };

    const alerts = this.computeTeacherAlerts({
      groupsView,
      abandonmentAlerts,
      debtorAccounts,
      pendingEnrollmentsCount,
      pendingGroupChangesCount,
      preEnrollmentsPendingCount: preEnrollmentsView.pendingCount,
      subs,
      profile: profileView,
    });

    return {
      activity,
      presences,
      accounting: accountingIndicators,
      payments,
      groups: groupsView,
      profile: profileView,
      statistics,
      export: exportInfo,
      preEnrollments: preEnrollmentsView,
      alerts,
    };
  }

  private sessionSummary(s: { id: string; date: Date; startTime: string; status: string; group: { id: string; name: string } }) {
    return {
      id: s.id,
      date: s.date,
      startTime: s.startTime,
      status: s.status,
      group: s.group,
    };
  }

  private topCounts(values: string[], limit = 5): { label: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([label, count]) => ({ label, count }));
  }

  /**
   * Statistiques avancées (RM-DSH-011) : agrégats déjà connus (revenus, régularisation des dettes)
   * + un taux d'assiduité moyen calculé au niveau plateforme (agrégat brut par statut, plus léger
   * qu'une boucle par élève/groupe comme `AttendanceService.getGroupStats` — cohérent avec "certains
   * indicateurs peuvent être recalculés de manière différée pour la performance", RM-DSH-013).
   */
  private async buildTeacherStatistics(
    groupIds: string[],
    totalGroups: number,
    totalActiveStudents: number,
    accountingIndicators: Awaited<ReturnType<AccountingService['getTeacherIndicators']>>,
  ) {
    const byStatus = await this.prisma.attendance.groupBy({
      by: ['status'],
      where: { session: { groupId: { in: groupIds } } },
      _count: { _all: true },
    });
    const total = byStatus.reduce((sum, s) => sum + s._count._all, 0);
    const attended = byStatus
      .filter((s) => s.status === 'PRESENT' || s.status === 'LATE')
      .reduce((sum, s) => sum + s._count._all, 0);
    return {
      available: true,
      totalGroups,
      totalActiveStudents,
      revenueThisMonth: accountingIndicators.revenueThisMonth,
      revenueThisYear: accountingIndicators.revenueThisYear,
      bestCollectionMonth: accountingIndicators.bestCollectionMonth,
      worstCollectionMonth: accountingIndicators.worstCollectionMonth,
      debtRegularizationRate: accountingIndicators.debtRegularizationRate,
      averageAttendanceRate: total > 0 ? Math.round((attended / total) * 1000) / 1000 : null,
    };
  }

  private computeTeacherAlerts(input: {
    groupsView: { id: string; name: string; category: string }[];
    abandonmentAlerts: { student: { firstName: string; lastName: string }; groupName: string }[];
    debtorAccounts: {
      account: { student: { firstName: string; lastName: string }; group: { name: string } };
      alert: boolean;
    }[];
    pendingEnrollmentsCount: number;
    pendingGroupChangesCount: number;
    preEnrollmentsPendingCount: number;
    subs: { status: string; expiresAt: Date | null; plan: { name: string } }[];
    profile: { pendingAdminValidation: boolean; completenessScore: number };
  }): DashboardAlert[] {
    const alerts: DashboardAlert[] = [];

    if (input.pendingEnrollmentsCount > 0) {
      alerts.push({
        level: toAlertLevel('IMPORTANT'),
        code: 'PENDING_ENROLLMENTS',
        message: `${input.pendingEnrollmentsCount} demande(s) d'inscription en attente de décision.`,
      });
    }
    if (input.pendingGroupChangesCount > 0) {
      alerts.push({
        level: toAlertLevel('IMPORTANT'),
        code: 'PENDING_GROUP_CHANGES',
        message: `${input.pendingGroupChangesCount} demande(s) de changement de groupe en attente.`,
      });
    }
    const fullGroups = input.groupsView.filter((g) => g.category === 'FULL');
    if (fullGroups.length > 0) {
      alerts.push({
        level: toAlertLevel('INFORMATION'),
        code: 'GROUPS_FULL',
        message: `Groupe(s) complet(s) : ${fullGroups.map((g) => g.name).join(', ')}.`,
      });
    }
    const needsStudents = input.groupsView.filter((g) => g.category === 'NEEDS_STUDENTS');
    if (needsStudents.length > 0) {
      alerts.push({
        level: toAlertLevel('INFORMATION'),
        code: 'GROUPS_NEED_STUDENTS',
        message: `Groupe(s) avec des places disponibles : ${needsStudents.map((g) => g.name).join(', ')}.`,
      });
    }
    for (const a of input.abandonmentAlerts) {
      alerts.push({
        level: toAlertLevel('CRITICAL'),
        code: 'ABANDONMENT_RISK',
        message: `${a.student.firstName} ${a.student.lastName} (${a.groupName}) : absences consécutives au seuil d'abandon.`,
      });
    }
    for (const d of input.debtorAccounts) {
      if (!d.alert) continue;
      alerts.push({
        level: toAlertLevel('CRITICAL'),
        code: 'DEBTOR_ACCOUNT',
        message: `Compte débiteur important : ${d.account.student.firstName} ${d.account.student.lastName} (${d.account.group.name}).`,
      });
    }
    const now = Date.now();
    for (const s of input.subs) {
      if (s.status !== 'ACTIVE' || !s.expiresAt) continue;
      const daysLeft = (s.expiresAt.getTime() - now) / 86_400_000;
      if (daysLeft > 0 && daysLeft <= SUBSCRIPTION_EXPIRY_WARNING_DAYS) {
        alerts.push({
          level: toAlertLevel('IMPORTANT'),
          code: 'SUBSCRIPTION_EXPIRING',
          message: `Abonnement "${s.plan.name}" arrivant à échéance le ${s.expiresAt.toLocaleDateString('fr-FR')}.`,
        });
      }
    }
    if (input.profile.pendingAdminValidation) {
      alerts.push({
        level: toAlertLevel('IMPORTANT'),
        code: 'PROFILE_PENDING_VALIDATION',
        message: 'Votre profil est en attente de validation administrative.',
      });
    } else if (input.profile.completenessScore < 100) {
      alerts.push({
        level: toAlertLevel('INFORMATION'),
        code: 'PROFILE_INCOMPLETE',
        message: `Profil complété à ${input.profile.completenessScore}% : complétez-le pour rassurer les Parents.`,
      });
    }
    if (input.preEnrollmentsPendingCount > 0) {
      alerts.push({
        level: toAlertLevel('INFORMATION'),
        code: 'PENDING_PRE_ENROLLMENTS',
        message: `${input.preEnrollmentsPendingCount} préinscription(s) en attente de traitement.`,
      });
    }
    return alerts;
  }

  // ===============================================================================================
  // Parent (Ch.16.4)
  // ===============================================================================================

  async getParentDashboard(parentId: string) {
    const students = await this.prisma.student.findMany({
      where: { parentId, status: 'ACTIVE' },
      orderBy: { firstName: 'asc' },
    });
    const multipleChildren = students.length > 1;
    const now = new Date();
    const today = todayDateOnly();

    const children = await Promise.all(
      students.map((student) => this.buildChildDashboard(parentId, student, today, now)),
    );

    const alerts = this.computeParentAlerts(children, multipleChildren);

    return { multipleChildren, children, alerts };
  }

  private async buildChildDashboard(
    parentId: string,
    student: { id: string; firstName: string; lastName: string },
    today: Date,
    now: Date,
  ) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId: student.id, status: 'ACTIVE' },
      include: {
        group: {
          include: {
            subject: { select: { name: true } },
            schoolLevel: { select: { name: true } },
            teacher: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    const groupIds = enrollments.map((e) => e.groupId);

    const [sessionsUpcoming, accounts, comments, attendanceView, existingNotices] = await Promise.all([
      this.prisma.session.findMany({
        where: { groupId: { in: groupIds }, date: { gte: today }, status: { in: ['PLANNED', 'CANCELLED', 'POSTPONED'] } },
        include: { group: { select: { id: true, name: true } } },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        take: 15,
      }),
      this.accounting.getParentChildSummary(parentId, student.id),
      this.prisma.enrollmentComment.findMany({
        where: { enrollmentId: { in: enrollments.map((e) => e.id) }, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { enrollment: { select: { group: { select: { name: true } } } } },
      }),
      this.attendance.getStudentAttendanceForParent(parentId, student.id),
      this.prisma.absenceNotice.findMany({ where: { studentId: student.id, session: { date: { gte: today } } } }),
    ]);

    const reportedSessionIds = new Set(existingNotices.map((n) => n.sessionId));
    const upcomingSessions = sessionsUpcoming
      .filter((s) => s.status === 'PLANNED')
      .map((s) => ({
        ...this.sessionSummary(s),
        canReportAbsence: theoreticalStart(s) > now,
        absenceReported: reportedSessionIds.has(s.id),
      }));
    const cancelledOrPostponed = sessionsUpcoming
      .filter((s) => s.status === 'CANCELLED' || s.status === 'POSTPONED')
      .map((s) => this.sessionSummary(s));

    const globalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

    return {
      student: { id: student.id, firstName: student.firstName, lastName: student.lastName },
      groups: enrollments.map((e) => ({
        enrollmentId: e.id,
        group: {
          id: e.group.id,
          name: e.group.name,
          subject: e.group.subject.name,
          schoolLevel: e.group.schoolLevel.name,
          teacher: e.group.teacher,
          teachingMode: e.group.teachingMode,
        },
      })),
      upcomingSessions,
      cancelledOrPostponedSessions: cancelledOrPostponed,
      accounts,
      globalBalance: Math.round(globalBalance * 1000) / 1000,
      recentComments: comments.map((c) => ({
        id: c.id,
        body: c.body,
        authorRole: c.authorRole,
        createdAt: c.createdAt,
        groupName: c.enrollment.group.name,
      })),
      attendanceSummary: attendanceView.summary,
      recentAttendance: attendanceView.entries.slice(0, 5),
    };
  }

  private computeParentAlerts(
    children: Awaited<ReturnType<DashboardService['buildChildDashboard']>>[],
    multipleChildren: boolean,
  ): DashboardAlert[] {
    const alerts: DashboardAlert[] = [];
    const suffix = (name: string) => (multipleChildren ? ` (${name})` : '');

    for (const c of children) {
      const childName = `${c.student.firstName} ${c.student.lastName}`;
      if (c.globalBalance < 0) {
        alerts.push({
          level: toAlertLevel('IMPORTANT'),
          code: 'CHILD_DEBTOR_BALANCE',
          message: `Solde débiteur${suffix(childName)} : ${Math.abs(c.globalBalance).toFixed(3)} TND restant à régler.`,
        });
      }
      if (c.cancelledOrPostponedSessions.length > 0) {
        alerts.push({
          level: toAlertLevel('INFORMATION'),
          code: 'SESSION_CANCELLED_OR_POSTPONED',
          message: `${c.cancelledOrPostponedSessions.length} séance(s) annulée(s)/reportée(s) à venir${suffix(childName)}.`,
        });
      }
      // NOT-DSH-006 existe aussi en notification poussee via `TemporalJobsService`; cette alerte
      // reste l'equivalent visible a la demande dans le tableau de bord Parent.

      const closingSoon = c.upcomingSessions.filter((s) => {
        if (!s.canReportAbsence || s.absenceReported) return false;
        const start = theoreticalStart(s);
        return start.getTime() - Date.now() <= 2 * 60 * 60 * 1000;
      });
      if (closingSoon.length > 0) {
        alerts.push({
          level: toAlertLevel('IMPORTANT'),
          code: 'ABSENCE_NOTICE_DEADLINE_SOON',
          message: `Dernier moment pour signaler une absence prévisible${suffix(childName)} (séance dans moins de 2h).`,
        });
      }
    }
    return alerts;
  }

  // ===============================================================================================
  // Administrateur / Super Administrateur (Ch.16.5/16.6)
  // ===============================================================================================

  private hasPermission(user: { roles: string[]; administratorPermissions?: string[] | null }, code: string): boolean {
    if (user.roles.includes('SUPER_ADMIN')) return true;
    return (user.administratorPermissions ?? []).includes(code);
  }

  /**
   * RM-DSH-007 : contenu entièrement dépendant des autorisations. ERR-DSH-002 est traité ici comme
   * "informations masquées" section par section (pas de blocage global de la route) — voir
   * `PERM-DSH-002` (Annexe I) qui autorise tout Admin à *consulter* son propre tableau de bord.
   * `AUDIT_VIEW` est une permission mintée pour ce chantier (aucun endpoint de lecture des
   * `AuditLog` n'existait avant Ch.16) ; les autres sections réutilisent les permissions existantes
   * (ACC_VALIDATE/SCH_VALIDATE/ABO_VALIDATE) plutôt que d'en inventer une par section.
   */
  async getAdminDashboard(user: { id: string; roles: string[]; administratorPermissions?: string[] | null }) {
    const has = (code: string) => this.hasPermission(user, code);

    const [activeTeacherCount, activeParentCount, activeGroupCount, activeStudentCount, activeEnrollmentCount] =
      await Promise.all([
        this.prisma.user.count({ where: { roles: { has: 'TEACHER' }, status: 'ACTIVE' } }),
        this.prisma.user.count({ where: { roles: { has: 'PARENT' }, status: 'ACTIVE' } }),
        this.prisma.group.count({ where: { status: { in: ['ACTIVE', 'FULL'] } } }),
        this.prisma.student.count({ where: { status: 'ACTIVE' } }),
        this.prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
      ]);

    const overview = {
      activeTeacherCount,
      activeParentCount,
      activeGroupCount,
      activeStudentCount,
      activeEnrollmentCount,
    };

    const referentials = {
      subjectCount: await this.prisma.subject.count({ where: { isActive: true } }),
      schoolLevelCount: await this.prisma.schoolLevel.count({ where: { isActive: true } }),
      schoolCount: await this.prisma.school.count({ where: { isActive: true } }),
      openAcademicYearCount: await this.prisma.academicYear.count({ where: { status: 'OPEN' } }),
    };

    const alerts: DashboardAlert[] = [];

    const pendingAccountValidations = has('ACC_VALIDATE')
      ? await this.prisma.user.findMany({
          where: { status: 'PENDING_VALIDATION' },
          select: { id: true, email: true, roles: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
          take: 20,
        })
      : null;
    if (pendingAccountValidations && pendingAccountValidations.length > 0) {
      alerts.push({
        level: toAlertLevel('IMPORTANT'),
        code: 'PENDING_ACCOUNT_VALIDATIONS',
        message: `${pendingAccountValidations.length} compte(s) en attente de validation.`,
      });
    }

    const pendingSchoolSituations = has('SCH_VALIDATE')
      ? await this.prisma.studentSchoolSituation.findMany({
          where: { status: 'PENDING_VALIDATION' },
          select: { id: true, studentId: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
          take: 20,
        })
      : null;
    if (pendingSchoolSituations && pendingSchoolSituations.length > 0) {
      alerts.push({
        level: toAlertLevel('IMPORTANT'),
        code: 'PENDING_SCHOOL_SITUATIONS',
        message: `${pendingSchoolSituations.length} situation(s) scolaire(s) en attente de validation.`,
      });
    }

    const subscriptionsSection = has('ABO_VALIDATE')
      ? await this.buildAdminSubscriptionsSection(alerts)
      : null;

    const auditLogSection = has('AUDIT_VIEW')
      ? {
          totalCount: await this.prisma.auditLog.count(),
          recent: await this.prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: { id: true, action: true, targetType: true, targetId: true, userId: true, createdAt: true },
          }),
        }
      : null;

    return {
      overview,
      generalStatistics: overview,
      referentials,
      pendingAccountValidations,
      pendingSchoolSituations,
      subscriptions: subscriptionsSection,
      auditLog: auditLogSection,
      alerts,
    };
  }

  private async buildAdminSubscriptionsSection(alerts: DashboardAlert[]) {
    const [pendingPayment, active, suspended, expired] = await Promise.all([
      this.prisma.subscription.count({ where: { status: 'PENDING_PAYMENT' } }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.subscription.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.subscription.count({ where: { status: 'EXPIRED' } }),
    ]);
    if (pendingPayment > 0) {
      alerts.push({
        level: toAlertLevel('IMPORTANT'),
        code: 'PENDING_SUBSCRIPTION_VALIDATIONS',
        message: `${pendingPayment} abonnement(s) en attente de validation de paiement.`,
      });
    }
    return { pendingPaymentCount: pendingPayment, activeCount: active, suspendedCount: suspended, expiredCount: expired };
  }

  /** Ch.16.6 : vision complète, sans filtrage par permission (Super Admin = tous les droits). */
  async getSuperAdminDashboard() {
    const admin = await this.getAdminDashboard({ id: 'super-admin', roles: ['SUPER_ADMIN'] });
    const totalAdminsCount = await this.prisma.administrator.count({ where: { disabledAt: null } });
    return { ...admin, totalAdminsCount };
  }

  /**
   * RM-DSH-008 : lecture seule du tableau de bord d'un autre utilisateur, réservée au Super Admin.
   * Aucun autre utilisateur — pas même un autre Super Admin le cas échéant — ne peut consulter le
   * tableau de bord du Super Administrateur (voir `getSuperAdminDashboard`, route dédiée).
   */
  async getUserDashboard(targetUserId: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { administrator: true },
    });
    if (!target) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    if (target.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException(
        'Le tableau de bord du Super Administrateur ne peut être consulté par personne d’autre (RM-DSH-008)',
      );
    }
    if (target.roles.includes('TEACHER')) {
      return { role: 'TEACHER' as const, dashboard: await this.getTeacherDashboard(targetUserId) };
    }
    if (target.roles.includes('PARENT')) {
      return { role: 'PARENT' as const, dashboard: await this.getParentDashboard(targetUserId) };
    }
    if (target.roles.includes('ADMIN')) {
      return {
        role: 'ADMIN' as const,
        dashboard: await this.getAdminDashboard({
          id: targetUserId,
          roles: ['ADMIN'],
          administratorPermissions: target.administrator?.permissions ?? [],
        }),
      };
    }
    throw new BadRequestException('Aucun tableau de bord disponible pour cet utilisateur (ERR-DSH-003)');
  }
}
