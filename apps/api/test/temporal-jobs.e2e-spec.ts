import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TemporalJobsService } from '../src/temporal-jobs/temporal-jobs.service';

function dateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}

function addHours(d: Date, hours: number): Date {
  return new Date(d.getTime() + hours * 60 * 60 * 1000);
}

function hhmm(d: Date): string {
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

describe('Temporal jobs (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jobs: TemporalJobsService;
  const runId = Date.now();

  let subjectId: string;
  let schoolLevelId: string;
  let academicYearId: string;

  async function cleanupCronFixtures() {
    const users = await prisma.user.findMany({
      where: { email: { startsWith: 'e2e-cron-' } },
      select: { id: true, roles: true },
    });
    const userIds = users.map((u) => u.id);
    const teacherIds = users.filter((u) => u.roles.includes('TEACHER')).map((u) => u.id);
    const parentIds = users.filter((u) => u.roles.includes('PARENT')).map((u) => u.id);
    const groups = await prisma.group.findMany({ where: { teacherId: { in: teacherIds } }, select: { id: true } });
    const groupIds = groups.map((g) => g.id);
    const students = await prisma.student.findMany({ where: { parentId: { in: parentIds } }, select: { id: true } });
    const studentIds = students.map((s) => s.id);
    const enrollments = await prisma.enrollment.findMany({
      where: { OR: [{ groupId: { in: groupIds } }, { studentId: { in: studentIds } }] },
      select: { id: true },
    });
    const enrollmentIds = enrollments.map((e) => e.id);
    const sessions = await prisma.session.findMany({ where: { groupId: { in: groupIds } }, select: { id: true } });
    const sessionIds = sessions.map((s) => s.id);
    const announcements = await prisma.groupAnnouncement.findMany({ where: { groupId: { in: groupIds } }, select: { id: true } });
    const announcementIds = announcements.map((a) => a.id);
    const accounts = await prisma.accountingAccount.findMany({ where: { enrollmentId: { in: enrollmentIds } }, select: { id: true } });
    const accountIds = accounts.map((a) => a.id);
    const years = await prisma.academicYear.findMany({ where: { label: { startsWith: 'E2E Cron' } }, select: { id: true } });
    const yearIds = years.map((y) => y.id);

    await prisma.scheduledNotificationMarker.deleteMany({});
    await prisma.activity.deleteMany({ where: { OR: [{ userId: { in: userIds } }, { refId: { in: [...sessionIds, ...announcementIds, ...accountIds] } }] } });
    await prisma.absenceNotice.deleteMany({ where: { OR: [{ sessionId: { in: sessionIds } }, { studentId: { in: studentIds } }, { parentId: { in: parentIds } }] } });
    await prisma.accountingEntry.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.accountingAccount.deleteMany({ where: { id: { in: accountIds } } });
    await prisma.accountingPeriod.deleteMany({ where: { academicYearId: { in: yearIds } } });
    await prisma.attendanceHistory.deleteMany({ where: { attendance: { sessionId: { in: sessionIds } } } });
    await prisma.attendance.deleteMany({ where: { sessionId: { in: sessionIds } } });
    await prisma.session.deleteMany({ where: { id: { in: sessionIds } } });
    await prisma.groupAnnouncementRead.deleteMany({ where: { announcementId: { in: announcementIds } } });
    await prisma.groupAnnouncement.deleteMany({ where: { id: { in: announcementIds } } });
    await prisma.enrollment.deleteMany({ where: { id: { in: enrollmentIds } } });
    await prisma.groupSchedule.deleteMany({ where: { groupId: { in: groupIds } } });
    await prisma.group.deleteMany({ where: { id: { in: groupIds } } });
    await prisma.studentSchoolSituation.deleteMany({ where: { studentId: { in: studentIds } } });
    await prisma.student.deleteMany({ where: { id: { in: studentIds } } });
    await prisma.subscription.deleteMany({ where: { teacherId: { in: teacherIds } } });
    await prisma.subscriptionPlan.deleteMany({ where: { code: { startsWith: 'E2E_CRON_' } } });
    await prisma.loginHistory.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userSession.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.passwordResetToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.emailVerificationToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.teacherProfile.deleteMany({ where: { id: { in: teacherIds } } });
    await prisma.parentProfile.deleteMany({ where: { id: { in: parentIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.academicYear.deleteMany({ where: { id: { in: yearIds } } });
  }
  async function createUser(role: 'TEACHER' | 'PARENT', label: string) {
    const user = await prisma.user.create({
      data: {
        email: `e2e-cron-${role.toLowerCase()}-${label}-${runId}@example.com`,
        passwordHash: 'test',
        status: 'ACTIVE',
        roles: [role],
      },
    });
    if (role === 'TEACHER') {
      await prisma.teacherProfile.create({
        data: { id: user.id, firstName: 'Prof', lastName: label, phone: '20000000', city: 'Tunis', status: 'VALIDATED' },
      });
    } else {
      await prisma.parentProfile.create({
        data: { id: user.id, firstName: 'Parent', lastName: label, phone: '20000000', city: 'Tunis', validatedAt: new Date() },
      });
    }
    return user;
  }

  async function createGroup(teacherId: string, label: string) {
    return prisma.group.create({
      data: {
        teacherId,
        subjectId,
        schoolLevelId,
        academicYearId,
        name: `Groupe ${label}`,
        capacity: 10,
        publicPrice: 30,
        teachingMode: 'PRESENTIAL',
        absenceBillingPolicy: 'ALL_BILLED',
        visibilityWhenFull: 'VISIBLE',
        startDate: dateOnly(addDays(new Date(), -30)),
        status: 'ACTIVE',
      },
    });
  }

  async function createEnrollment(parentId: string, groupId: string, label: string) {
    const student = await prisma.student.create({
      data: { parentId, firstName: 'Enfant', lastName: label, status: 'ACTIVE' },
    });
    const enrollment = await prisma.enrollment.create({
      data: { studentId: student.id, groupId, status: 'ACTIVE', requestedAt: new Date(), decidedAt: new Date(), decidedById: parentId },
    });
    return { student, enrollment };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    jobs = app.get(TemporalJobsService);

    await cleanupCronFixtures();

    subjectId = (await prisma.subject.findFirstOrThrow()).id;
    schoolLevelId = (await prisma.schoolLevel.findFirstOrThrow()).id;
    const year = await prisma.academicYear.create({
      data: {
        label: `E2E Cron ${runId}`,
        startDate: dateOnly(addDays(new Date(), -60)),
        endDate: dateOnly(addDays(new Date(), 120)),
        status: 'OPEN',
      },
    });
    academicYearId = year.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('sends session reminders, missing-attendance reminders and absence-deadline reminders once', async () => {
    const now = new Date(Date.UTC(2026, 6, 27, 8, 0, 0));
    const teacher = await createUser('TEACHER', 'sessions');
    const parent = await createUser('PARENT', 'sessions');
    const group = await createGroup(teacher.id, 'sessions');
    const { student } = await createEnrollment(parent.id, group.id, 'Sessions');

    const reminderStart = addHours(now, 24.5);
    const reminderSession = await prisma.session.create({
      data: { groupId: group.id, date: dateOnly(reminderStart), startTime: hhmm(reminderStart), durationMinutes: 60, teachingMode: 'PRESENTIAL', status: 'PLANNED' },
    });
    const missingStart = addDays(now, -2);
    const missingSession = await prisma.session.create({
      data: { groupId: group.id, date: dateOnly(missingStart), startTime: '08:00', durationMinutes: 60, teachingMode: 'PRESENTIAL', status: 'PLANNED' },
    });
    const deadlineStart = addHours(now, 1);
    const deadlineSession = await prisma.session.create({
      data: { groupId: group.id, date: dateOnly(deadlineStart), startTime: hhmm(deadlineStart), durationMinutes: 60, teachingMode: 'PRESENTIAL', status: 'PLANNED' },
    });

    await expect(jobs.sendSession24hReminders(now)).resolves.toMatchObject({ sent: 2 });
    await expect(jobs.sendSession24hReminders(now)).resolves.toMatchObject({ sent: 0 });
    await expect(jobs.sendMissingAttendanceReminders(now)).resolves.toMatchObject({ sent: 1 });
    await expect(jobs.sendMissingAttendanceReminders(now)).resolves.toMatchObject({ sent: 0 });
    await expect(jobs.sendAbsenceDeadlineReminders(now)).resolves.toMatchObject({ sent: 1 });
    await prisma.absenceNotice.create({ data: { sessionId: deadlineSession.id, studentId: student.id, enrollmentId: (await prisma.enrollment.findFirstOrThrow({ where: { studentId: student.id } })).id, parentId: parent.id } });
    await expect(jobs.sendAbsenceDeadlineReminders(now)).resolves.toMatchObject({ sent: 0 });

    await expect(prisma.activity.count({ where: { refId: reminderSession.id, type: 'SES_24H_REMINDER' } })).resolves.toBe(2);
    await expect(prisma.activity.count({ where: { refId: missingSession.id, type: 'SES_ATTENDANCE_MISSING_J1' } })).resolves.toBe(1);
    await expect(prisma.activity.count({ where: { refId: deadlineSession.id, type: 'DSH_ABSENCE_NOTICE_DEADLINE' } })).resolves.toBe(1);
  });

  it('processes announcement publication and expiration notifications once', async () => {
    const now = new Date(Date.UTC(2026, 6, 27, 8, 0, 0));
    const teacher = await createUser('TEACHER', 'announcements');
    const group = await createGroup(teacher.id, 'announcements');
    const announcement = await prisma.groupAnnouncement.create({
      data: { groupId: group.id, createdById: teacher.id, title: 'Info', body: 'Message', createdAt: addHours(now, -2), publishAt: addHours(now, -1), expiresAt: addHours(now, -0.5) },
    });

    await expect(jobs.processAnnouncements(now)).resolves.toMatchObject({ sent: 2 });
    await expect(jobs.processAnnouncements(now)).resolves.toMatchObject({ sent: 0 });
    await expect(prisma.activity.count({ where: { refId: announcement.id, type: { in: ['COM_ANNOUNCEMENT_PUBLISHED', 'COM_ANNOUNCEMENT_EXPIRED'] } } })).resolves.toBe(2);
  });

  it('processes subscription reminders, expiration and RM-CYC-020 suspension once', async () => {
    const now = new Date(Date.UTC(2026, 6, 27, 8, 0, 0));
    const plan = await prisma.subscriptionPlan.create({ data: { code: `E2E_CRON_${runId}`, name: 'E2E Pro', price: 99, maxActiveEnrollments: null, isTrial: false } });
    const reminderTeacher = await createUser('TEACHER', 'abo-reminder');
    const expiredTeacher = await createUser('TEACHER', 'abo-expired');
    const suspendTeacher = await createUser('TEACHER', 'abo-suspend');

    const reminderSub = await prisma.subscription.create({ data: { teacherId: reminderTeacher.id, planId: plan.id, academicYearId, status: 'ACTIVE', requestedAt: now, activatedAt: now, expiresAt: addDays(now, 7) } });
    const expiredSub = await prisma.subscription.create({ data: { teacherId: expiredTeacher.id, planId: plan.id, academicYearId, status: 'ACTIVE', requestedAt: addDays(now, -20), activatedAt: addDays(now, -20), expiresAt: addDays(now, -1) } });
    const suspendSub = await prisma.subscription.create({ data: { teacherId: suspendTeacher.id, planId: plan.id, academicYearId, status: 'EXPIRED', requestedAt: addDays(now, -20), activatedAt: addDays(now, -20), expiresAt: addDays(now, -8) } });

    await expect(jobs.processSubscriptionDeadlines(now)).resolves.toMatchObject({ sent: 4 });
    await expect(jobs.processSubscriptionDeadlines(now)).resolves.toMatchObject({ sent: 0 });
    await expect(prisma.activity.count({ where: { refId: reminderSub.id, type: 'SUBSCRIPTION_EXPIRY_J7' } })).resolves.toBe(1);
    await expect(prisma.subscription.findUniqueOrThrow({ where: { id: expiredSub.id } })).resolves.toMatchObject({ status: 'EXPIRED' });
    await expect(prisma.user.findUniqueOrThrow({ where: { id: suspendTeacher.id } })).resolves.toMatchObject({ status: 'SUSPENDED' });
    await expect(prisma.activity.count({ where: { refId: suspendSub.id, type: 'SUBSCRIPTION_GRACE_SUSPENDED' } })).resolves.toBe(1);
  });

  it('sends automatic payment reminders and daily digests once', async () => {
    const now = new Date(Date.UTC(2026, 6, 27, 8, 0, 0));
    const teacher = await createUser('TEACHER', 'payment');
    const parent = await createUser('PARENT', 'payment');
    const group = await createGroup(teacher.id, 'payment');
    const { enrollment } = await createEnrollment(parent.id, group.id, 'Payment');
    const period = await prisma.accountingPeriod.create({ data: { academicYearId, openDate: dateOnly(addDays(now, -30)), closeDate: dateOnly(addDays(now, 90)), status: 'OPEN' } });
    const account = await prisma.accountingAccount.create({ data: { enrollmentId: enrollment.id, periodId: period.id, status: 'ACTIVE' } });
    await prisma.accountingEntry.create({
      data: { entryNumber: `ECR-${runId}-1`, accountId: account.id, periodId: period.id, type: 'SESSION', direction: 'DEBIT', amount: 30, effectiveDate: now, authorId: teacher.id },
    });

    const paymentRun = await jobs.sendAutomaticPaymentReminders(now);
    expect(paymentRun.sent).toBeGreaterThanOrEqual(1);
    await expect(jobs.sendAutomaticPaymentReminders(now)).resolves.toMatchObject({ sent: 0 });
    await expect(jobs.runDailyDigest(now)).resolves.toMatchObject({ sent: expect.any(Number) });
    await expect(jobs.runDailyDigest(now)).resolves.toMatchObject({ sent: 0 });
    await expect(prisma.activity.count({ where: { refId: account.id, type: 'CPT_PAYMENT_REMINDER' } })).resolves.toBe(1);
    await expect(prisma.activity.count({ where: { type: 'DAILY_DIGEST', userId: { in: [teacher.id, parent.id] } } })).resolves.toBe(2);
  });
});
