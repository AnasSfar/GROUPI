import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { grantActiveSubscription } from './helpers/grant-subscription';

/**
 * E2E tests for the attendance module (Ch.14 — Gestion des présences), run against the real
 * `groupi_test` Postgres database (see test/jest-e2e.setup.ts), following the same shape as
 * enrollments.e2e-spec.ts / sessions.e2e-spec.ts.
 *
 * All accounts use the `e2e-att-` email prefix; afterAll cleans up everything this file created.
 * Referential data (subject/schoolLevel/academicYear/school) is expected to already be seeded in
 * `groupi_test` (via `npx prisma db seed`), exactly like the enrollments suite.
 */
describe('Attendance (e2e)', () => {
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
    const email = `e2e-att-${role.toLowerCase()}-${label}-${runId}@example.com`;
    const initialStudent =
      role === 'PARENT'
        ? {
            firstName: 'Kid',
            lastName: label,
            schoolLevelId: (
              await prisma.schoolLevel.findFirstOrThrow({ where: { isActive: true, code: { startsWith: 'PRIM' } } })
            ).id,
            schoolId: (await prisma.school.findFirstOrThrow({ where: { isActive: true, type: 'PRIMARY' } })).id,
          }
        : undefined;
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
        ...(role === 'PARENT' ? { initialStudent } : {}),
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

  async function createOpenGroup(
    teacherToken: string,
    name: string,
    absenceBillingPolicy: 'ALL_BILLED' | 'EXCUSED_NOT_BILLED' | 'NONE_BILLED',
    abandonmentThreshold = 3,
  ): Promise<any> {
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
        absenceBillingPolicy,
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

  async function enrollAndAccept(parentToken: string, teacherToken: string, studentId: string, groupId: string) {
    const reqRes = await api()
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ studentId, groupId })
      .expect(201);
    await api()
      .post(`/api/v1/groups/${groupId}/enrollments/${reqRes.body.id}/accept`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({})
      .expect(201);
    return reqRes.body.id as string;
  }

  async function createSession(teacherToken: string, groupId: string, date: Date): Promise<any> {
    const res = await api()
      .post(`/api/v1/groups/${groupId}/sessions`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ date: isoDate(date), startTime: '08:00', durationMinutes: 60, teachingMode: 'PRESENTIAL' })
      .expect(201);
    return res.body;
  }

  let teacher: Actor;
  let outsider: Actor;
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
    if (!subjectLevel) {
      throw new Error(
        'Aucune combinaison matière/niveau trouvée dans groupi_test — lancez `npx prisma db seed` avant cette suite.',
      );
    }
    subjectId = subjectLevel.subjectId;
    schoolLevelId = subjectLevel.schoolLevelId;

    const academicYear = await prisma.academicYear.findFirst({ where: { status: 'OPEN' } });
    if (!academicYear) throw new Error('Aucune année académique OPEN dans groupi_test.');
    academicYearId = academicYear.id;

    const school = await prisma.school.findFirst({ where: { isActive: true } });
    if (!school) throw new Error('Aucun établissement actif dans groupi_test.');
    schoolId = school.id;

    teacher = await registerAndActivate('TEACHER', `main-${runId}`);
    outsider = await registerAndActivate('TEACHER', `outsider-${runId}`);
    parent1 = await registerAndActivate('PARENT', `p1-${runId}`);
    parent2 = await registerAndActivate('PARENT', `p2-${runId}`);
  });

  afterAll(async () => {
    const teacherIds = [teacher.id, outsider.id];
    const parentIds = [parent1.id, parent2.id];

    const groups = await prisma.group.findMany({ where: { teacherId: { in: teacherIds } }, select: { id: true } });
    const groupIds = groups.map((g) => g.id);
    const sessions = await prisma.session.findMany({ where: { groupId: { in: groupIds } }, select: { id: true } });
    const sessionIds = sessions.map((s) => s.id);

    const attendances = await prisma.attendance.findMany({
      where: { sessionId: { in: sessionIds } },
      select: { id: true },
    });
    const attendanceIds = attendances.map((a) => a.id);
    await prisma.attendanceHistory.deleteMany({ where: { attendanceId: { in: attendanceIds } } });
    await prisma.attendance.deleteMany({ where: { sessionId: { in: sessionIds } } });
    await prisma.session.deleteMany({ where: { id: { in: sessionIds } } });

    const students = await prisma.student.findMany({ where: { parentId: { in: parentIds } }, select: { id: true } });
    const studentIds = students.map((s) => s.id);

    // Ch.15 : chaque inscription active possède un compte de suivi comptable (FK stricte).
    const enrollmentsToDelete = await prisma.enrollment.findMany({
      where: { groupId: { in: groupIds } },
      select: { id: true },
    });
    const accountsToDelete = await prisma.accountingAccount.findMany({
      where: { enrollmentId: { in: enrollmentsToDelete.map((e) => e.id) } },
      select: { id: true },
    });
    await prisma.accountingEntry.deleteMany({ where: { accountId: { in: accountsToDelete.map((a) => a.id) } } });
    await prisma.accountingAccount.deleteMany({ where: { id: { in: accountsToDelete.map((a) => a.id) } } });

    await prisma.enrollment.deleteMany({ where: { groupId: { in: groupIds } } });
    await prisma.groupSchedule.deleteMany({ where: { groupId: { in: groupIds } } });
    await prisma.group.deleteMany({ where: { id: { in: groupIds } } });

    if (studentIds.length > 0) {
      await prisma.student.updateMany({ where: { id: { in: studentIds } }, data: { currentSchoolSituationId: null } });
      await prisma.studentSchoolSituation.deleteMany({ where: { studentId: { in: studentIds } } });
      await prisma.student.deleteMany({ where: { id: { in: studentIds } } });
    }

    const userIds = [...teacherIds, ...parentIds];
    await prisma.activity.deleteMany({ where: { userId: { in: userIds } } });
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

  describe('saisie et validation', () => {
    let groupId: string;
    let student1Id: string;
    let student2Id: string;
    let sessionId: string;

    beforeAll(async () => {
      const group = await createOpenGroup(teacher.token, `E2E-ATT-${runId} Groupe Saisie`, 'EXCUSED_NOT_BILLED');
      groupId = group.id;
      const s1 = await createStudent(parent1.token, `S1-${runId}`);
      const s2 = await createStudent(parent2.token, `S2-${runId}`);
      student1Id = s1.id;
      student2Id = s2.id;
      await enrollAndAccept(parent1.token, teacher.token, student1Id, groupId);
      await enrollAndAccept(parent2.token, teacher.token, student2Id, groupId);
      const session = await createSession(teacher.token, groupId, today);
      sessionId = session.id;
    });

    it('lists two blank entries (NON_RENSEIGNEE) before any saisie', async () => {
      const res = await api()
        .get(`/api/v1/sessions/${sessionId}/attendance`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(200);
      expect(res.body.entries).toHaveLength(2);
      expect(res.body.entries.every((e: any) => e.attendance === null)).toBe(true);
    });

    it('refuses access to a teacher who does not own the group -> 403', async () => {
      await api()
        .get(`/api/v1/sessions/${sessionId}/attendance`)
        .set('Authorization', `Bearer ${outsider.token}`)
        .expect(403);
      await api()
        .put(`/api/v1/sessions/${sessionId}/attendance/${student1Id}`)
        .set('Authorization', `Bearer ${outsider.token}`)
        .send({ status: 'PRESENT' })
        .expect(403);
    });

    it('refuses saisie for a student not enrolled in the group (ERR-ATT-002)', async () => {
      const stranger = await createStudent(parent1.token, `Stranger-${runId}`);
      await api()
        .put(`/api/v1/sessions/${sessionId}/attendance/${stranger.id}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ status: 'PRESENT' })
        .expect(400);
    });

    it('rejects LATE without lateDuration (ERR-ATT-022), negative (ERR-ATT-016) and over duration (ERR-ATT-017)', async () => {
      await api()
        .put(`/api/v1/sessions/${sessionId}/attendance/${student1Id}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ status: 'LATE' })
        .expect(400);
      await api()
        .put(`/api/v1/sessions/${sessionId}/attendance/${student1Id}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ status: 'LATE', lateDuration: -5 })
        .expect(400);
      await api()
        .put(`/api/v1/sessions/${sessionId}/attendance/${student1Id}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ status: 'LATE', lateDuration: 120 })
        .expect(400);
    });

    it('records PRESENT (billable) and LATE (billable) for the two students', async () => {
      const res1 = await api()
        .put(`/api/v1/sessions/${sessionId}/attendance/${student1Id}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ status: 'PRESENT' })
        .expect(200);
      expect(res1.body.status).toBe('PRESENT');
      expect(res1.body.billable).toBe(true);

      const res2 = await api()
        .put(`/api/v1/sessions/${sessionId}/attendance/${student2Id}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ status: 'LATE', lateDuration: 15 })
        .expect(200);
      expect(res2.body.status).toBe('LATE');
      expect(res2.body.lateDuration).toBe(15);
      expect(res2.body.billable).toBe(true);
    });

    it('corrects a recorded attendance (progressive saisie) before validation', async () => {
      const res = await api()
        .put(`/api/v1/sessions/${sessionId}/attendance/${student2Id}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ status: 'EXCUSED_ABSENT', reason: 'Correction avant validation' })
        .expect(200);
      expect(res.body.status).toBe('EXCUSED_ABSENT');
      // EXCUSED_NOT_BILLED : une absence excusée n'est pas facturée.
      expect(res.body.billable).toBe(false);
    });

    it('resets a not-yet-validated attendance back to NON_RENSEIGNEE', async () => {
      await api()
        .delete(`/api/v1/sessions/${sessionId}/attendance/${student2Id}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(200);
      const res = await api()
        .get(`/api/v1/sessions/${sessionId}/attendance`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(200);
      const entry = res.body.entries.find((e: any) => e.student.id === student2Id);
      expect(entry.attendance).toBeNull();
    });

    it('refuses validation while a student still has no status (RM-ATT-027)', async () => {
      await api()
        .post(`/api/v1/sessions/${sessionId}/attendance/validate`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(400);
    });

    it('validates once every active student has a status -> session becomes COMPLETED', async () => {
      await api()
        .put(`/api/v1/sessions/${sessionId}/attendance/${student2Id}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ status: 'UNEXCUSED_ABSENT' })
        .expect(200);

      const res = await api()
        .post(`/api/v1/sessions/${sessionId}/attendance/validate`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(201);
      expect(res.body.session.status).toBe('COMPLETED');
    });

    it('refuses a second validation (ERR-ATT-005)', async () => {
      await api()
        .post(`/api/v1/sessions/${sessionId}/attendance/validate`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(400);
    });

    it('still allows a correction shortly after validation (within the 48h window)', async () => {
      const res = await api()
        .put(`/api/v1/sessions/${sessionId}/attendance/${student1Id}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ status: 'LATE', lateDuration: 5, reason: 'Correction post-validation' })
        .expect(200);
      expect(res.body.status).toBe('LATE');
    });

    it('no longer allows deleting a validated attendance', async () => {
      await api()
        .delete(`/api/v1/sessions/${sessionId}/attendance/${student1Id}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(400);
    });

    it('exposes the student attendance history to their own parent, but not to another parent', async () => {
      const res = await api()
        .get(`/api/v1/parent/children/${student1Id}/attendance`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      expect(res.body.entries.length).toBeGreaterThan(0);
      expect(res.body.summary.totalSessions).toBeGreaterThan(0);

      await api()
        .get(`/api/v1/parent/children/${student1Id}/attendance`)
        .set('Authorization', `Bearer ${parent2.token}`)
        .expect(403);
    });

    it('computes group stats over the GROUP period', async () => {
      const res = await api()
        .get(`/api/v1/groups/${groupId}/attendance/stats?period=GROUP`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(200);
      expect(res.body.length).toBe(2);
      const s1 = res.body.find((s: any) => s.student.id === student1Id);
      expect(s1.totalSessions).toBe(1);
      expect(s1.attendanceRate).toBe(1);
    });

    it('lists the group register with every recorded entry', async () => {
      const res = await api()
        .get(`/api/v1/groups/${groupId}/attendance/register`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(200);
      expect(res.body.length).toBe(2);
    });
  });

  describe('verrouillage automatique (fenêtre de 48h)', () => {
    it('locks a completed session past its deadline and refuses further modification', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-ATT-${runId} Groupe Verrou`, 'ALL_BILLED');
      const student = await createStudent(parent1.token, `S-Lock-${runId}`);
      await enrollAndAccept(parent1.token, teacher.token, student.id, group.id);

      // Séance largement passée (bien au-delà des 48h de fenêtre de correction).
      const pastSession = await createSession(teacher.token, group.id, addDays(today, -5));

      await api()
        .put(`/api/v1/sessions/${pastSession.id}/attendance/${student.id}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ status: 'PRESENT' })
        .expect(200);
      await api()
        .post(`/api/v1/sessions/${pastSession.id}/attendance/validate`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(201);

      const listRes = await api()
        .get(`/api/v1/sessions/${pastSession.id}/attendance`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(200);
      expect(listRes.body.session.status).toBe('LOCKED');
      expect(listRes.body.session.locked).toBe(true);

      await api()
        .put(`/api/v1/sessions/${pastSession.id}/attendance/${student.id}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ status: 'EXCUSED_ABSENT' })
        .expect(400);
    });
  });

  describe("détection d'abandon (Ch.14.10)", () => {
    it('flags a student reaching the group abandonment threshold', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-ATT-${runId} Groupe Abandon`, 'ALL_BILLED', 2);
      const student = await createStudent(parent2.token, `S-Abandon-${runId}`);
      await enrollAndAccept(parent2.token, teacher.token, student.id, group.id);

      for (const offset of [-10, -9]) {
        const session = await createSession(teacher.token, group.id, addDays(today, offset));
        await api()
          .put(`/api/v1/sessions/${session.id}/attendance/${student.id}`)
          .set('Authorization', `Bearer ${teacher.token}`)
          .send({ status: 'UNEXCUSED_ABSENT' })
          .expect(200);
        await api()
          .post(`/api/v1/sessions/${session.id}/attendance/validate`)
          .set('Authorization', `Bearer ${teacher.token}`)
          .expect(201);
      }

      const res = await api()
        .get(`/api/v1/groups/${group.id}/attendance/abandonment-alerts`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].student.id).toBe(student.id);
      expect(res.body[0].consecutiveUnexcusedAbsences).toBe(2);
    });
  });
});
