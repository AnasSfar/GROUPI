import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { theoreticalStart } from '../sessions/sessions.service';

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

function dateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export interface JobResult {
  sent: number;
  skipped: number;
}

@Injectable()
export class TemporalJobsService {
  private readonly logger = new Logger(TemporalJobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly email: EmailService,
  ) {}

  @Cron('0 * * * *')
  async runHourlyCron(): Promise<void> {
    await this.runHourlyJobs(new Date());
  }

  @Cron('15 6 * * *')
  async runDailyCron(): Promise<void> {
    await this.runDailyDigest(new Date());
  }

  async runHourlyJobs(now = new Date()) {
    const results = await Promise.all([
      this.sendSession24hReminders(now),
      this.sendMissingAttendanceReminders(now),
      this.processAnnouncements(now),
      this.processSubscriptionDeadlines(now),
      this.sendAutomaticPaymentReminders(now),
      this.sendAbsenceDeadlineReminders(now),
    ]);
    const sent = results.reduce((sum, r) => sum + r.sent, 0);
    this.logger.log(`Jobs temporels horaires ex\u00e9cut\u00e9s : ${sent} notification(s) envoy\u00e9e(s).`);
    return { sent, details: results };
  }

  private async markOnce(key: string, type: string, refType?: string, refId?: string): Promise<boolean> {
    try {
      await this.prisma.scheduledNotificationMarker.create({ data: { key, type, refType, refId } });
      return true;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return false;
      throw err;
    }
  }

  private async activeParentRecipients(groupId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { groupId, status: 'ACTIVE' },
      include: { student: { select: { parentId: true, parent: { select: { user: { select: { email: true } } } } } } },
    });
    const byParent = new Map<string, string>();
    for (const e of enrollments) byParent.set(e.student.parentId, e.student.parent.user.email);
    return [...byParent.entries()].map(([parentId, email]) => ({ parentId, email }));
  }

  async sendSession24hReminders(now = new Date()): Promise<JobResult> {
    const from = addHours(now, 24);
    const to = addHours(now, 25);
    const sessions = await this.prisma.session.findMany({
      where: { status: 'PLANNED', date: { gte: dateOnly(from), lte: dateOnly(to) } },
      include: { group: { include: { teacher: { select: { user: { select: { email: true } } } } } } },
    });
    let sent = 0;
    let skipped = 0;
    for (const session of sessions) {
      const start = theoreticalStart(session);
      if (start < from || start >= to) continue;
      const recipients = [
        { userId: session.group.teacherId, email: session.group.teacher.user.email, role: 'teacher' },
        ...(await this.activeParentRecipients(session.groupId)).map((p) => ({ userId: p.parentId, email: p.email, role: 'parent' })),
      ];
      for (const r of recipients) {
        const key = `NOT-SES-009:${session.id}:${r.userId}`;
        if (!(await this.markOnce(key, 'SES_24H_REMINDER', 'Session', session.id))) {
          skipped++;
          continue;
        }
        await this.notifications.notify({
          recipientUserId: r.userId,
          type: 'SES_24H_REMINDER',
          priority: 'INFORMATION',
          title: 'Rappel de s\u00e9ance dans 24h',
          body: `S\u00e9ance du groupe "${session.group.name}" pr\u00e9vue le ${session.date.toLocaleDateString('fr-FR')} \u00e0 ${session.startTime}.`,
          refType: 'Session',
          refId: session.id,
        });
        sent++;
      }
    }
    return { sent, skipped };
  }

  async sendMissingAttendanceReminders(now = new Date()): Promise<JobResult> {
    const cutoff = addDays(now, -1);
    const sessions = await this.prisma.session.findMany({
      where: { status: 'PLANNED', date: { lte: dateOnly(cutoff) } },
      include: { group: { include: { teacher: { select: { user: { select: { email: true } } } }, enrollments: { where: { status: 'ACTIVE' }, select: { studentId: true } } } }, attendances: { select: { studentId: true } } },
    });
    let sent = 0;
    let skipped = 0;
    for (const session of sessions) {
      const end = addHours(theoreticalStart(session), session.durationMinutes / 60);
      if (end > cutoff) continue;
      const recorded = new Set(session.attendances.map((a) => a.studentId));
      const missing = session.group.enrollments.some((e) => !recorded.has(e.studentId));
      if (!missing) continue;
      const key = `NOT-SES-013:${session.id}:${session.group.teacherId}`;
      if (!(await this.markOnce(key, 'SES_ATTENDANCE_MISSING_J1', 'Session', session.id))) {
        skipped++;
        continue;
      }
      await this.notifications.notify({
        recipientUserId: session.group.teacherId,
        type: 'SES_ATTENDANCE_MISSING_J1',
        priority: 'IMPORTANT',
        title: 'Pr\u00e9sences non saisies',
        body: `Les pr\u00e9sences de la s\u00e9ance du groupe "${session.group.name}" du ${session.date.toLocaleDateString('fr-FR')} n'ont pas encore \u00e9t\u00e9 saisies.`,
        refType: 'Session',
        refId: session.id,
        sendEmail: () => this.email.sendSessionAttendanceMissing(session.group.teacher.user.email, session.group.name, session.date),
      });
      sent++;
    }
    return { sent, skipped };
  }

  async processAnnouncements(now = new Date()): Promise<JobResult> {
    const announcements = await this.prisma.groupAnnouncement.findMany({
      where: { deletedAt: null, OR: [{ publishAt: { lte: now } }, { expiresAt: { lte: now } }] },
      include: { group: { select: { id: true, name: true, teacherId: true } } },
    });
    let sent = 0;
    let skipped = 0;
    for (const a of announcements) {
      if (a.publishAt <= now && a.publishAt > a.createdAt) {
        const key = `NOT-COM-006:${a.id}:${a.group.teacherId}`;
        if (await this.markOnce(key, 'COM_ANNOUNCEMENT_PUBLISHED', 'GroupAnnouncement', a.id)) {
          await this.notifications.notify({
            recipientUserId: a.group.teacherId,
            type: 'COM_ANNOUNCEMENT_PUBLISHED',
            priority: 'INFORMATION',
            title: 'Annonce programm\u00e9e publi\u00e9e',
            body: `L'annonce "${a.title}" du groupe "${a.group.name}" vient d'\u00eatre publi\u00e9e.`,
            refType: 'GroupAnnouncement',
            refId: a.id,
          });
          sent++;
        } else skipped++;
      }
      if (a.expiresAt && a.expiresAt <= now) {
        const key = `NOT-COM-005:${a.id}:${a.group.teacherId}`;
        if (await this.markOnce(key, 'COM_ANNOUNCEMENT_EXPIRED', 'GroupAnnouncement', a.id)) {
          await this.notifications.notify({
            recipientUserId: a.group.teacherId,
            type: 'COM_ANNOUNCEMENT_EXPIRED',
            priority: 'INFORMATION',
            title: 'Annonce de groupe expir\u00e9e',
            body: `L'annonce "${a.title}" du groupe "${a.group.name}" est arriv\u00e9e \u00e0 expiration.`,
            refType: 'GroupAnnouncement',
            refId: a.id,
          });
          sent++;
        } else skipped++;
      }
    }
    return { sent, skipped };
  }

  async processSubscriptionDeadlines(now = new Date()): Promise<JobResult> {
    const subs = await this.prisma.subscription.findMany({
      where: { expiresAt: { not: null }, status: { in: ['ACTIVE', 'PENDING_PAYMENT', 'EXPIRED'] } },
      include: { plan: true, teacher: { include: { user: { select: { email: true, status: true } } } } },
    });
    let sent = 0;
    let skipped = 0;
    for (const sub of subs) {
      if (!sub.expiresAt) continue;
      for (const days of [15, 7, 3]) {
        const reminderDay = dateOnly(addDays(sub.expiresAt, -days));
        if (dateOnly(now).getTime() !== reminderDay.getTime()) continue;
        const code = days === 15 ? 'NOT-ABO-001' : days === 7 ? 'NOT-ABO-002' : 'NOT-ABO-003';
        const type = `SUBSCRIPTION_EXPIRY_J${days}`;
        const priority = days === 15 ? 'IMPORTANT' : 'CRITICAL';
        const key = `${code}:${sub.id}:${sub.teacherId}`;
        if (!(await this.markOnce(key, type, 'Subscription', sub.id))) {
          skipped++;
          continue;
        }
        await this.notifications.notify({
          recipientUserId: sub.teacherId,
          type,
          priority,
          title: `Abonnement bient\u00f4t expir\u00e9 (J-${days})`,
          body: `Votre abonnement "${sub.plan.name}" expire le ${sub.expiresAt.toLocaleDateString('fr-FR')}.`,
          refType: 'Subscription',
          refId: sub.id,
          sendEmail: () => this.email.sendSubscriptionExpiryReminder(sub.teacher.user.email, sub.plan.name, sub.expiresAt!, days),
        });
        sent++;
      }
      if (sub.expiresAt <= now) {
        if (sub.status !== 'EXPIRED') {
          await this.prisma.subscription.update({ where: { id: sub.id }, data: { status: 'EXPIRED' } });
        }
        const expiredKey = `NOT-ABO-004:${sub.id}:${sub.teacherId}`;
        if (await this.markOnce(expiredKey, 'SUBSCRIPTION_EXPIRED', 'Subscription', sub.id)) {
          await this.notifications.notify({
            recipientUserId: sub.teacherId,
            type: 'SUBSCRIPTION_EXPIRED',
            priority: 'CRITICAL',
            title: 'Abonnement expir\u00e9',
            body: `Votre abonnement "${sub.plan.name}" a expir\u00e9 le ${sub.expiresAt.toLocaleDateString('fr-FR')}.`,
            refType: 'Subscription',
            refId: sub.id,
            sendEmail: () => this.email.sendSubscriptionExpired(sub.teacher.user.email, sub.plan.name, sub.expiresAt!),
          });
          sent++;
        } else skipped++;
        const graceDeadline = addDays(sub.expiresAt, 7);
        if (graceDeadline <= now && sub.teacher.user.status !== 'SUSPENDED' && !(await this.teacherHasUsableOpenSubscription(sub.teacherId, now))) {
          const suspendKey = `RM-CYC-020:${sub.id}:${sub.teacherId}`;
          if (await this.markOnce(suspendKey, 'SUBSCRIPTION_GRACE_SUSPENDED', 'Subscription', sub.id)) {
            await this.prisma.$transaction([
              this.prisma.user.update({ where: { id: sub.teacherId }, data: { status: 'SUSPENDED', tokenVersion: { increment: 1 } } }),
              this.prisma.teacherProfile.update({ where: { id: sub.teacherId }, data: { status: 'SUSPENDED' } }),
              this.prisma.userSession.updateMany({ where: { userId: sub.teacherId, revokedAt: null }, data: { revokedAt: now } }),
              this.prisma.auditLog.create({
                data: {
                  userId: null,
                  action: 'ACCOUNT_SUSPENDED_BY_SUBSCRIPTION_GRACE',
                  targetType: 'User',
                  targetId: sub.teacherId,
                  oldValues: { status: sub.teacher.user.status },
                  newValues: { status: 'SUSPENDED', reason: 'RM-CYC-020', subscriptionId: sub.id },
                },
              }),
            ]);
            await this.notifications.notify({
              recipientUserId: sub.teacherId,
              type: 'SUBSCRIPTION_GRACE_SUSPENDED',
              priority: 'CRITICAL',
              title: 'Compte Professeur suspendu',
              body: `Le d\u00e9lai de gr\u00e2ce de 7 jours apr\u00e8s expiration de l'abonnement "${sub.plan.name}" est d\u00e9pass\u00e9.`,
              refType: 'Subscription',
              refId: sub.id,
              sendEmail: () => this.email.sendSubscriptionGraceSuspended(sub.teacher.user.email, sub.plan.name),
            });
            sent++;
          } else skipped++;
        }
      }
    }
    return { sent, skipped };
  }

  private async teacherHasUsableOpenSubscription(teacherId: string, now: Date): Promise<boolean> {
    const graceFloor = addDays(now, -7);
    const usable = await this.prisma.subscription.findFirst({
      where: {
        teacherId,
        status: { in: ['ACTIVE', 'EXPIRED'] },
        academicYear: { status: 'OPEN' },
        OR: [{ expiresAt: null }, { expiresAt: { gte: graceFloor } }],
      },
      select: { id: true },
    });
    return usable !== null;
  }

  private async accountBalance(accountId: string): Promise<number> {
    const entries = await this.prisma.accountingEntry.findMany({ where: { accountId, status: { not: 'CREATED' } }, select: { direction: true, amount: true } });
    return round3(entries.reduce((sum, e) => sum + (e.direction === 'CREDIT' ? Number(e.amount) : -Number(e.amount)), 0));
  }

  async sendAutomaticPaymentReminders(now = new Date()): Promise<JobResult> {
    const accounts = await this.prisma.accountingAccount.findMany({
      where: { status: { in: ['CREATED', 'ACTIVE'] }, enrollment: { status: 'ACTIVE' } },
      include: { enrollment: { include: { student: { include: { parent: { include: { user: { select: { email: true } } } } } }, group: true } } },
    });
    let sent = 0;
    let skipped = 0;
    for (const account of accounts) {
      const balance = await this.accountBalance(account.id);
      if (balance >= 0) continue;
      const key = `NOT-CPT-007:${account.id}:${dayKey(now)}`;
      if (!(await this.markOnce(key, 'CPT_PAYMENT_REMINDER_AUTO', 'AccountingAccount', account.id))) {
        skipped++;
        continue;
      }
      const studentName = `${account.enrollment.student.firstName} ${account.enrollment.student.lastName}`;
      await this.notifications.notify({
        recipientUserId: account.enrollment.student.parentId,
        type: 'CPT_PAYMENT_REMINDER',
        priority: 'IMPORTANT',
        title: 'Rappel de paiement',
        body: `Solde d\u00e9biteur de ${Math.abs(balance).toFixed(3)} TND pour ${studentName} (groupe "${account.enrollment.group.name}").`,
        refType: 'AccountingAccount',
        refId: account.id,
        sendEmail: () => this.email.sendPaymentReminder(account.enrollment.student.parent.user.email, studentName, Math.abs(balance)),
      });
      sent++;
    }
    return { sent, skipped };
  }

  async sendAbsenceDeadlineReminders(now = new Date()): Promise<JobResult> {
    const to = addHours(now, 2);
    const sessions = await this.prisma.session.findMany({
      where: { status: 'PLANNED', date: { gte: dateOnly(now), lte: dateOnly(to) } },
      include: { group: { select: { name: true } }, absenceNotices: { select: { studentId: true } } },
    });
    let sent = 0;
    let skipped = 0;
    for (const session of sessions) {
      const start = theoreticalStart(session);
      if (start < now || start > to) continue;
      const reported = new Set(session.absenceNotices.map((n) => n.studentId));
      const enrollments = await this.prisma.enrollment.findMany({
        where: { groupId: session.groupId, status: 'ACTIVE', studentId: { notIn: [...reported] } },
        include: { student: { include: { parent: { include: { user: { select: { email: true } } } } } } },
      });
      for (const e of enrollments) {
        const key = `NOT-DSH-006:${session.id}:${e.student.parentId}:${e.studentId}`;
        if (!(await this.markOnce(key, 'DSH_ABSENCE_NOTICE_DEADLINE', 'Session', session.id))) {
          skipped++;
          continue;
        }
        const studentName = `${e.student.firstName} ${e.student.lastName}`;
        await this.notifications.notify({
          recipientUserId: e.student.parentId,
          type: 'DSH_ABSENCE_NOTICE_DEADLINE',
          priority: 'IMPORTANT',
          title: 'Dernier d\u00e9lai pour signaler une absence',
          body: `La s\u00e9ance de ${studentName} dans le groupe "${session.group.name}" commence \u00e0 ${session.startTime}.`,
          refType: 'Session',
          refId: session.id,
          sendEmail: () => this.email.sendAbsenceNoticeDeadline(e.student.parent.user.email, studentName, session.group.name, session.date, session.startTime),
        });
        sent++;
      }
    }
    return { sent, skipped };
  }

  async runDailyDigest(now = new Date()): Promise<JobResult> {
    const today = dateOnly(now);
    const tomorrow = addDays(today, 1);
    let sent = 0;
    let skipped = 0;
    const teachers = await this.prisma.teacherProfile.findMany({ where: { user: { status: 'ACTIVE' } }, include: { user: true, groups: { select: { id: true, name: true, status: true } } } });
    for (const teacher of teachers) {
      const groupIds = teacher.groups.map((g) => g.id);
      const [sessionsToday, debtorAccounts, fullGroups, absentStudents] = await Promise.all([
        this.prisma.session.count({ where: { groupId: { in: groupIds }, status: 'PLANNED', date: today } }),
        this.prisma.accountingAccount.findMany({ where: { enrollment: { groupId: { in: groupIds }, status: 'ACTIVE' } }, select: { id: true } }),
        Promise.resolve(teacher.groups.filter((g) => g.status === 'FULL').length),
        this.countStudentsAbsentSeveralSessions(groupIds),
      ]);
      let debts = 0;
      for (const account of debtorAccounts) if ((await this.accountBalance(account.id)) < 0) debts++;
      const key = `DAILY_DIGEST:${dayKey(today)}:${teacher.id}`;
      if (!(await this.markOnce(key, 'DAILY_DIGEST', undefined, undefined))) {
        skipped++;
        continue;
      }
      await this.notifications.notify({
        recipientUserId: teacher.id,
        type: 'DAILY_DIGEST',
        priority: 'INFORMATION',
        title: 'Synth\u00e8se quotidienne',
        body: `Aujourd'hui : ${sessionsToday} s\u00e9ance(s), ${debts} paiement(s) attendu(s), ${fullGroups} groupe(s) complet(s), ${absentStudents} \u00e9l\u00e8ve(s) absent(s) depuis plusieurs s\u00e9ances. Anniversaires non inclus : aucune date de naissance n'est mod\u00e9lis\u00e9e dans GROUPI.`,
      });
      sent++;
    }

    const parents = await this.prisma.parentProfile.findMany({ where: { user: { status: 'ACTIVE' } }, include: { user: true, students: true } });
    for (const parent of parents) {
      const studentIds = parent.students.map((s) => s.id);
      const [upcoming, notices, accounts] = await Promise.all([
        this.prisma.session.count({ where: { status: 'PLANNED', date: { gte: today, lt: tomorrow }, group: { enrollments: { some: { studentId: { in: studentIds }, status: 'ACTIVE' } } } } }),
        this.prisma.absenceNotice.count({ where: { parentId: parent.id, session: { date: { gte: today } } } }),
        this.prisma.accountingAccount.findMany({ where: { enrollment: { studentId: { in: studentIds }, status: 'ACTIVE' } }, select: { id: true } }),
      ]);
      let debts = 0;
      for (const account of accounts) if ((await this.accountBalance(account.id)) < 0) debts++;
      const key = `DAILY_DIGEST:${dayKey(today)}:${parent.id}`;
      if (!(await this.markOnce(key, 'DAILY_DIGEST', undefined, undefined))) {
        skipped++;
        continue;
      }
      await this.notifications.notify({
        recipientUserId: parent.id,
        type: 'DAILY_DIGEST',
        priority: 'INFORMATION',
        title: 'Synth\u00e8se quotidienne',
        body: `Aujourd'hui : ${upcoming} s\u00e9ance(s) pr\u00e9vue(s), ${notices} absence(s) signal\u00e9e(s) \u00e0 venir, ${debts} paiement(s) \u00e0 pr\u00e9voir.`,
      });
      sent++;
    }
    return { sent, skipped };
  }

  private async countStudentsAbsentSeveralSessions(groupIds: string[]): Promise<number> {
    if (groupIds.length === 0) return 0;
    const groups = await this.prisma.group.findMany({
      where: { id: { in: groupIds } },
      select: {
        id: true,
        abandonmentThreshold: true,
        enrollments: { where: { status: 'ACTIVE' }, select: { studentId: true } },
      },
    });
    const thresholds = new Map(groups.map((g) => [g.id, g.abandonmentThreshold]));
    const activePairs = new Set(groups.flatMap((g) => g.enrollments.map((e) => `${g.id}:${e.studentId}`)));
    const attendances = await this.prisma.attendance.findMany({
      where: { session: { groupId: { in: groupIds }, status: { in: ['COMPLETED', 'LOCKED'] } } },
      include: { session: { select: { groupId: true, date: true, startTime: true } } },
      orderBy: [{ session: { date: 'desc' } }, { session: { startTime: 'desc' } }],
    });
    const byPair = new Map<string, typeof attendances>();
    for (const attendance of attendances) {
      const key = `${attendance.session.groupId}:${attendance.studentId}`;
      if (activePairs.has(key)) byPair.set(key, [...(byPair.get(key) ?? []), attendance]);
    }
    let count = 0;
    for (const [key, list] of byPair.entries()) {
      const [groupId] = key.split(':');
      const threshold = thresholds.get(groupId) ?? 3;
      let streak = 0;
      for (const attendance of list) {
        if (attendance.status !== 'UNEXCUSED_ABSENT') break;
        streak++;
      }
      if (streak >= threshold) count++;
    }
    return count;
  }
}
