import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { grantActiveSubscription } from './helpers/grant-subscription';

/**
 * E2E tests for the notifications module (Ch.18 — Centre d'activités et notifications), run
 * against the real `groupi_test` Postgres database — same shape as group-change.e2e-spec.ts /
 * attendance.e2e-spec.ts. All accounts use the `e2e-not-` email prefix.
 */
describe('Notifications (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const runId = Date.now();
  const api = () => request(app.getHttpServer());
  const password = 'CorrectHorse123';

  function dateOnly(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
  function addDays(d: Date, days: number): Date {
    const copy = new Date(d);
    copy.setUTCDate(copy.getUTCDate() + days);
    return copy;
  }
  function isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
  const today = dateOnly(new Date());

  let subjectId: string;
  let schoolLevelId: string;
  let academicYearId: string;
  let schoolId: string;

  interface Actor {
    id: string;
    email: string;
    token: string;
  }

  async function registerAndActivate(role: 'TEACHER' | 'PARENT', label: string): Promise<Actor> {
    const email = `e2e-not-${role.toLowerCase()}-${label}-${runId}@example.com`;
    const res = await api()
      .post('/api/v1/auth/register')
      .send({
        email,
        password,
        role,
        firstName: 'Test',
        lastName: label,
        phone: '20000000',
        city: 'Tunis',
        acceptTerms: true,
        ...(role === 'TEACHER' ? { subjectIds: [subjectId], schoolLevelIds: [schoolLevelId] } : {}),
      })
      .expect(201);
    const userId = res.body.id as string;

    await prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
    if (role === 'TEACHER') {
      await prisma.teacherProfile.update({ where: { id: userId }, data: { status: 'VALIDATED' } });
      // Ch.22 : SubscriptionGuard exige un abonnement exploitable pour créer/modifier.
      await grantActiveSubscription(prisma, userId, academicYearId);
    } else {
      await prisma.parentProfile.update({ where: { id: userId }, data: { validatedAt: new Date() } });
    }

    const loginRes = await api().post('/api/v1/auth/login').send({ email, password }).expect(200);
    return { id: userId, email, token: loginRes.body.accessToken as string };
  }

  async function createOpenGroup(teacherToken: string, name: string, abandonmentThreshold = 3): Promise<any> {
    const res = await api()
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name,
        subjectId,
        schoolLevelId,
        academicYearId,
        capacity: 10,
        publicPrice: 30,
        teachingMode: 'PRESENTIAL',
        absenceBillingPolicy: 'ALL_BILLED',
        abandonmentThreshold,
        visibilityWhenFull: 'VISIBLE',
        startDate: isoDate(addDays(today, -30)),
        schedules: [{ dayOfWeek: 'MONDAY', startTime: '18:00', durationMinutes: 60 }],
      })
      .expect(201);
    const openRes = await api()
      .post(`/api/v1/groups/${res.body.id}/open`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(201);
    return openRes.body;
  }

  async function createStudent(parentToken: string, label: string): Promise<any> {
    const res = await api()
      .post('/api/v1/parent-profile/me/students')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ firstName: 'Enfant', lastName: label, schoolLevelId, schoolId })
      .expect(201);
    return res.body;
  }

  async function enroll(parentToken: string, studentId: string, groupId: string): Promise<string> {
    const res = await api()
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ studentId, groupId })
      .expect(201);
    return res.body.id as string;
  }

  async function createSession(teacherToken: string, groupId: string, date: Date): Promise<any> {
    const res = await api()
      .post(`/api/v1/groups/${groupId}/sessions`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ date: isoDate(date), startTime: '08:00', durationMinutes: 60, teachingMode: 'PRESENTIAL' })
      .expect(201);
    return res.body;
  }

  async function setAndValidate(teacherToken: string, sessionId: string, studentId: string, status: string) {
    await api()
      .put(`/api/v1/sessions/${sessionId}/attendance/${studentId}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ status })
      .expect(200);
    await api()
      .post(`/api/v1/sessions/${sessionId}/attendance/validate`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(201);
  }

  /** Poll (`emailSentAt` est renseigné de façon asynchrone, hors chemin critique — voir NotificationsService.notify). */
  async function waitForActivity(
    predicate: (a: any) => boolean,
    fetch: () => Promise<any[]>,
    timeoutMs = 3000,
  ): Promise<any> {
    const start = Date.now();
    for (;;) {
      const items = await fetch();
      const found = items.find(predicate);
      if (found && (found.emailSentAt || Date.now() - start > timeoutMs)) {
        return found;
      }
      if (Date.now() - start > timeoutMs) {
        return found ?? null;
      }
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  let teacher: Actor;
  let parent1: Actor;
  let parent2: Actor;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    const subjectLevel = await prisma.subjectLevel.findFirst({ where: { isAllowed: true, isActive: true } });
    if (!subjectLevel) throw new Error('Aucune combinaison matière/niveau — lancez `npx prisma db seed`.');
    subjectId = subjectLevel.subjectId;
    schoolLevelId = subjectLevel.schoolLevelId;

    const academicYear = await prisma.academicYear.findFirst({ where: { status: 'OPEN' } });
    if (!academicYear) throw new Error('Aucune année académique OPEN — lancez `npx prisma db seed`.');
    academicYearId = academicYear.id;

    const school = await prisma.school.findFirst({ where: { isActive: true } });
    if (!school) throw new Error('Aucun établissement actif — lancez `npx prisma db seed`.');
    schoolId = school.id;

    teacher = await registerAndActivate('TEACHER', `t-${runId}`);
    parent1 = await registerAndActivate('PARENT', `p1-${runId}`);
    parent2 = await registerAndActivate('PARENT', `p2-${runId}`);
  });

  afterAll(async () => {
    const teacherIds = [teacher.id];
    const parentIds = [parent1.id, parent2.id];
    const userIds = [...teacherIds, ...parentIds];

    const groups = await prisma.group.findMany({ where: { teacherId: { in: teacherIds } }, select: { id: true } });
    const groupIds = groups.map((g) => g.id);
    const students = await prisma.student.findMany({ where: { parentId: { in: parentIds } }, select: { id: true } });
    const studentIds = students.map((s) => s.id);
    const sessions = await prisma.session.findMany({ where: { groupId: { in: groupIds } }, select: { id: true } });
    const sessionIds = sessions.map((s) => s.id);
    const enrollments = await prisma.enrollment.findMany({
      where: { OR: [{ groupId: { in: groupIds } }, { studentId: { in: studentIds } }] },
      select: { id: true },
    });
    const enrollmentIds = enrollments.map((e) => e.id);

    await prisma.activity.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.attendanceHistory.deleteMany({ where: { attendance: { sessionId: { in: sessionIds } } } });
    await prisma.attendance.deleteMany({ where: { sessionId: { in: sessionIds } } });
    await prisma.session.deleteMany({ where: { id: { in: sessionIds } } });
    // Ch.15 : chaque inscription active possède un compte de suivi comptable (FK stricte).
    const accountsToDelete = await prisma.accountingAccount.findMany({
      where: { enrollmentId: { in: enrollmentIds } },
      select: { id: true },
    });
    await prisma.accountingEntry.deleteMany({ where: { accountId: { in: accountsToDelete.map((a) => a.id) } } });
    await prisma.accountingAccount.deleteMany({ where: { id: { in: accountsToDelete.map((a) => a.id) } } });
    await prisma.enrollment.deleteMany({ where: { id: { in: enrollmentIds } } });
    await prisma.groupSchedule.deleteMany({ where: { groupId: { in: groupIds } } });
    await prisma.group.deleteMany({ where: { id: { in: groupIds } } });

    if (studentIds.length > 0) {
      await prisma.student.updateMany({ where: { id: { in: studentIds } }, data: { currentSchoolSituationId: null } });
      await prisma.studentSchoolSituation.deleteMany({ where: { studentId: { in: studentIds } } });
      await prisma.student.deleteMany({ where: { id: { in: studentIds } } });
    }

    await prisma.loginHistory.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userSession.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.passwordResetToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.emailVerificationToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.subscription.deleteMany({ where: { teacherId: { in: teacherIds } } });
    await prisma.teacherSubject.deleteMany({ where: { teacherProfileId: { in: teacherIds } } });
    await prisma.teacherSchoolLevel.deleteMany({ where: { teacherProfileId: { in: teacherIds } } });
    await prisma.teacherProfile.deleteMany({ where: { id: { in: teacherIds } } });
    await prisma.parentProfile.deleteMany({ where: { id: { in: parentIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });

    await app.close();
  });

  describe('centre d’activités — visibilité et lecture', () => {
    it('creates an activity only for the recipient, never for another user (RM-NOT-003)', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-NOT-${runId} Groupe Visibilité`);
      const student = await createStudent(parent1.token, `S-Vis-${runId}`);
      const enrollmentId = await enroll(parent1.token, student.id, group.id);

      await api()
        .post(`/api/v1/groups/${group.id}/enrollments/${enrollmentId}/accept`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({})
        .expect(201);

      const mine = await api()
        .get('/api/v1/notifications/me')
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      const activity = mine.body.find((a: any) => a.type === 'INS_ACCEPTED' && a.refId === enrollmentId);
      expect(activity).toBeDefined();
      expect(activity.priority).toBe('IMPORTANT');
      expect(activity.readAt).toBeNull();

      const other = await api()
        .get('/api/v1/notifications/me')
        .set('Authorization', `Bearer ${parent2.token}`)
        .expect(200);
      expect(other.body.find((a: any) => a.refId === enrollmentId)).toBeUndefined();

      const teacherOwn = await api()
        .get('/api/v1/notifications/me')
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(200);
      expect(teacherOwn.body.find((a: any) => a.refId === enrollmentId)).toBeUndefined();
    });

    it('reflects unread count and marks an activity read idempotently (RM-NOT-011)', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-NOT-${runId} Groupe Lecture`);
      const student = await createStudent(parent1.token, `S-Read-${runId}`);
      const enrollmentId = await enroll(parent1.token, student.id, group.id);
      await api()
        .post(`/api/v1/groups/${group.id}/enrollments/${enrollmentId}/reject`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({})
        .expect(201);

      const mine = await api()
        .get('/api/v1/notifications/me')
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      const activity = mine.body.find((a: any) => a.type === 'INS_REJECTED' && a.refId === enrollmentId);
      expect(activity).toBeDefined();

      const before = await api()
        .get('/api/v1/notifications/me/unread-count')
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      expect(before.body.count).toBeGreaterThan(0);

      const readRes = await api()
        .post(`/api/v1/notifications/${activity.id}/read`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(201);
      expect(readRes.body.readAt).not.toBeNull();

      const after = await api()
        .get('/api/v1/notifications/me/unread-count')
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      expect(after.body.count).toBe(before.body.count - 1);

      // Idempotent : un second marquage ne doit ni échouer ni changer le compteur.
      const readAgain = await api()
        .post(`/api/v1/notifications/${activity.id}/read`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(201);
      expect(readAgain.body.readAt).toBe(readRes.body.readAt);
      const stillAfter = await api()
        .get('/api/v1/notifications/me/unread-count')
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      expect(stillAfter.body.count).toBe(after.body.count);
    });

    it('rejects marking an activity read for another user’s notification', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-NOT-${runId} Groupe Isolation`);
      const student = await createStudent(parent1.token, `S-Iso-${runId}`);
      const enrollmentId = await enroll(parent1.token, student.id, group.id);
      await api()
        .post(`/api/v1/groups/${group.id}/enrollments/${enrollmentId}/accept`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({})
        .expect(201);

      const mine = await api()
        .get('/api/v1/notifications/me')
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      const activity = mine.body.find((a: any) => a.refId === enrollmentId);

      await api()
        .post(`/api/v1/notifications/${activity.id}/read`)
        .set('Authorization', `Bearer ${parent2.token}`)
        .expect(404);
    });
  });

  describe('politique de canal par priorité (Ch.18.9/RM-NOT-008/009)', () => {
    it('never sends an email for an Information-priority activity (attendance Présent)', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-NOT-${runId} Groupe Info`);
      const student = await createStudent(parent1.token, `S-Info-${runId}`);
      const enrollmentId = await enroll(parent1.token, student.id, group.id);
      await api()
        .post(`/api/v1/groups/${group.id}/enrollments/${enrollmentId}/accept`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({})
        .expect(201);

      const session = await createSession(teacher.token, group.id, addDays(today, -1));
      await setAndValidate(teacher.token, session.id, student.id, 'PRESENT');

      const mine = await api()
        .get('/api/v1/notifications/me')
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      const activity = mine.body.find((a: any) => a.type === 'ATT_PRESENT' && a.refType === 'Attendance');
      expect(activity).toBeDefined();
      expect(activity.priority).toBe('INFORMATION');
      // Pas d'envoi tenté du tout pour une priorité Information : jamais de emailSentAt, même en attendant.
      await new Promise((r) => setTimeout(r, 300));
      const refetch = await api()
        .get('/api/v1/notifications/me')
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      expect(refetch.body.find((a: any) => a.id === activity.id).emailSentAt).toBeNull();
    });

    it('eventually sends an email for an Important-priority activity (attendance Absent non excusé)', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-NOT-${runId} Groupe Important`);
      const student = await createStudent(parent1.token, `S-Imp-${runId}`);
      const enrollmentId = await enroll(parent1.token, student.id, group.id);
      await api()
        .post(`/api/v1/groups/${group.id}/enrollments/${enrollmentId}/accept`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({})
        .expect(201);

      const session = await createSession(teacher.token, group.id, addDays(today, -1));
      await setAndValidate(teacher.token, session.id, student.id, 'UNEXCUSED_ABSENT');

      const found = await waitForActivity(
        (a) => a.type === 'ATT_UNEXCUSED_ABSENT' && a.refType === 'Attendance',
        async () => {
          const res = await api()
            .get('/api/v1/notifications/me')
            .set('Authorization', `Bearer ${parent1.token}`)
            .expect(200);
          return res.body;
        },
      );
      expect(found).toBeDefined();
      expect(found.priority).toBe('IMPORTANT');
      expect(found.emailSentAt).not.toBeNull();
    });
  });

  describe("alerte d'abandon (NOT-ATT-006/NOT-SES-010)", () => {
    it('notifies the teacher exactly once, at the exact crossing of the threshold', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-NOT-${runId} Groupe Abandon`, 2);
      const student = await createStudent(parent2.token, `S-Abandon-${runId}`);
      const enrollmentId = await enroll(parent2.token, student.id, group.id);
      await api()
        .post(`/api/v1/groups/${group.id}/enrollments/${enrollmentId}/accept`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({})
        .expect(201);

      for (const offset of [-10, -9]) {
        const session = await createSession(teacher.token, group.id, addDays(today, offset));
        await setAndValidate(teacher.token, session.id, student.id, 'UNEXCUSED_ABSENT');
      }

      const afterTwo = await api()
        .get('/api/v1/notifications/me')
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(200);
      const alerts = afterTwo.body.filter((a: any) => a.type === 'ATT_ABANDONMENT_THRESHOLD' && a.refId === student.id);
      expect(alerts.length).toBe(1);
      expect(alerts[0].priority).toBe('CRITICAL');

      // Une 3e absence consécutive ne doit pas générer une seconde alerte (franchissement déjà notifié).
      const session3 = await createSession(teacher.token, group.id, addDays(today, -8));
      await setAndValidate(teacher.token, session3.id, student.id, 'UNEXCUSED_ABSENT');

      const afterThree = await api()
        .get('/api/v1/notifications/me')
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(200);
      const stillAlerts = afterThree.body.filter(
        (a: any) => a.type === 'ATT_ABANDONMENT_THRESHOLD' && a.refId === student.id,
      );
      expect(stillAlerts.length).toBe(1);
    });
  });
});
