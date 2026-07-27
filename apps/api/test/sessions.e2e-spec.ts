import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { PrismaModule } from '../src/prisma/prisma.module';
import { AuthModule } from '../src/auth/auth.module';
import { GroupsModule } from '../src/groups/groups.module';
import { SessionsModule } from '../src/sessions/sessions.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { grantActiveSubscription } from './helpers/grant-subscription';

/**
 * E2E tests for the sessions module (Ch.13 — Les Séances), run against the real Postgres
 * `groupi_test` database (see test/jest-e2e.setup.ts).
 *
 * `SessionsModule` is not yet wired into `AppModule` (left for manual wiring, see the Ch.13 task
 * notes), so this suite builds its own minimal Nest testing module — Prisma/Auth/Groups/Sessions —
 * instead of importing `AppModule` directly, exactly like the app would once it is wired.
 *
 * All emails use the `e2e-ses-` prefix (never colliding with other suites) and all referential
 * fixtures (Subject/SchoolLevel/AcademicYear/Group) are created by this file with a `runId`-scoped
 * name, so the suite is independently re-runnable and afterAll fully cleans up what it created.
 */
describe('Sessions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const runId = Date.now();
  const teacherEmail = `e2e-ses-teacher-${runId}@example.com`;
  const outsiderEmail = `e2e-ses-outsider-${runId}@example.com`;
  const password = 'CorrectHorse123';

  let teacherToken: string;
  let outsiderToken: string;
  let subjectId: string;
  let schoolLevelId: string;
  let academicYearId: string;

  // --- date helpers mirroring SessionsService's own date-only / UTC arithmetic -----------------
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
  const DAY_NAMES = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ] as const;
  function dayOfWeekOf(d: Date): string {
    return DAY_NAMES[d.getUTCDay()];
  }

  const today = dateOnly(new Date());
  // 14-day window (exactly two weeks) so any weekday occurring in it occurs exactly twice —
  // makes the expected generated count fully deterministic regardless of the actual weekday.
  const groupStart = today;
  const groupEnd = addDays(today, 13);
  const scheduleDay1 = dayOfWeekOf(today);
  const scheduleDay2 = dayOfWeekOf(addDays(today, 1));

  const api = () => request(app.getHttpServer());

  async function registerAndValidateTeacher(email: string): Promise<string> {
    const registerRes = await api()
      .post('/api/v1/auth/register')
      .send({
        email,
        password,
        role: 'TEACHER',
        firstName: 'Prof',
        lastName: 'Séances',
        phone: '20000001',
        city: 'Tunis',
      })
      .expect(201);

    await prisma.teacherProfile.update({
      where: { id: registerRes.body.id },
      data: { status: 'VALIDATED' },
    });
    // Ch.22 : SubscriptionGuard exige un abonnement exploitable pour créer/modifier.
    await grantActiveSubscription(prisma, registerRes.body.id, academicYearId);

    const loginRes = await api().post('/api/v1/auth/login').send({ email, password }).expect(200);
    return loginRes.body.accessToken as string;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        AuthModule,
        GroupsModule,
        SessionsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    const subject = await prisma.subject.create({
      data: { name: `E2E SES Subject ${runId}`, code: `E2ESES${runId}`, isActive: true },
    });
    subjectId = subject.id;

    const schoolLevel = await prisma.schoolLevel.create({
      data: { name: `E2E SES Level ${runId}`, code: `E2ESESLVL${runId}`, order: 999, isActive: true },
    });
    schoolLevelId = schoolLevel.id;

    await prisma.subjectLevel.create({
      data: { subjectId, schoolLevelId, isAllowed: true, isActive: true },
    });

    const academicYear = await prisma.academicYear.create({
      data: {
        label: `E2E-SES-${runId}`,
        startDate: addDays(today, -30),
        endDate: addDays(today, 240),
        status: 'OPEN',
      },
    });
    academicYearId = academicYear.id;

    teacherToken = await registerAndValidateTeacher(teacherEmail);
    outsiderToken = await registerAndValidateTeacher(outsiderEmail);
  });

  afterAll(async () => {
    const users = await prisma.user.findMany({
      where: { email: { startsWith: 'e2e-ses-' } },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    // Ch.22 : FK RESTRICT sur subscription.{teacher_id,academic_year_id} — doit précéder la
    // suppression de l'année académique et du professeur ci-dessous.
    await prisma.subscription.deleteMany({ where: { teacherId: { in: userIds } } });

    const groups = await prisma.group.findMany({
      where: { name: { startsWith: `E2E-SES-${runId}` } },
      select: { id: true },
    });
    const groupIds = groups.map((g) => g.id);
    if (groupIds.length > 0) {
      await prisma.session.deleteMany({ where: { groupId: { in: groupIds } } });
      await prisma.groupSchedule.deleteMany({ where: { groupId: { in: groupIds } } });
      await prisma.group.deleteMany({ where: { id: { in: groupIds } } });
    }

    await prisma.subjectLevel.deleteMany({ where: { subjectId } });
    await prisma.subject.deleteMany({ where: { id: subjectId } });
    await prisma.schoolLevel.deleteMany({ where: { id: schoolLevelId } });
    await prisma.academicYear.deleteMany({ where: { id: academicYearId } });

    if (userIds.length > 0) {
      await prisma.loginHistory.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.userSession.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.passwordResetToken.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.teacherProfile.deleteMany({ where: { id: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }

    await app.close();
  });

  async function createGroup(name: string, schedules: unknown[]) {
    const res = await api()
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name,
        subjectId,
        schoolLevelId,
        academicYearId,
        capacity: 10,
        publicPrice: 50,
        teachingMode: 'PRESENTIAL',
        absenceBillingPolicy: 'ALL_BILLED',
        visibilityWhenFull: 'VISIBLE',
        startDate: isoDate(groupStart),
        endDate: isoDate(groupEnd),
        schedules,
      })
      .expect(201);
    return res.body;
  }

  describe('generation from the weekly schedule', () => {
    let groupId: string;

    beforeAll(async () => {
      const group = await createGroup(`E2E-SES-${runId} Groupe Génération`, [
        { dayOfWeek: scheduleDay1, startTime: '09:00', durationMinutes: 60 },
        { dayOfWeek: scheduleDay2, startTime: '11:00', durationMinutes: 90 },
      ]);
      groupId = group.id;
    });

    it('creates exactly one session per (date, schedule) occurrence in the window', async () => {
      const res = await api()
        .post(`/api/v1/groups/${groupId}/sessions/generate`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(201);

      // 14-day window, 2 weekly schedules -> each occurs exactly twice.
      expect(res.body.count).toBe(4);
      expect(res.body.sessions).toHaveLength(4);
      for (const session of res.body.sessions) {
        expect(session.status).toBe('PLANNED');
        expect(session.teachingMode).toBe('PRESENTIAL');
      }
    });

    it('is idempotent: generating again creates no duplicate sessions', async () => {
      const res = await api()
        .post(`/api/v1/groups/${groupId}/sessions/generate`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(201);

      expect(res.body.count).toBe(0);
      expect(res.body.sessions).toHaveLength(0);

      const listRes = await api()
        .get(`/api/v1/groups/${groupId}/sessions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
      expect(listRes.body).toHaveLength(4);
    });

    it('rejects access from a teacher who does not own the group -> 403', async () => {
      await api()
        .get(`/api/v1/groups/${groupId}/sessions`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(403);

      await api()
        .post(`/api/v1/groups/${groupId}/sessions/generate`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(403);
    });

    it('creates an exceptional session outside the weekly schedule', async () => {
      const res = await api()
        .post(`/api/v1/groups/${groupId}/sessions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          date: isoDate(addDays(groupStart, 2)),
          startTime: '20:00',
          durationMinutes: 45,
          teachingMode: 'ONLINE',
        })
        .expect(201);

      expect(res.body.status).toBe('PLANNED');
      expect(res.body.teachingMode).toBe('ONLINE');

      const listRes = await api()
        .get(`/api/v1/groups/${groupId}/sessions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
      expect(listRes.body).toHaveLength(5);
    });

    it('rejects a duplicate exceptional session on the exact same slot -> 400', async () => {
      await api()
        .post(`/api/v1/groups/${groupId}/sessions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          date: isoDate(addDays(groupStart, 2)),
          startTime: '20:00',
          durationMinutes: 45,
          teachingMode: 'ONLINE',
        })
        .expect(400);
    });

    it('postpones a planned session: old -> POSTPONED, new -> PLANNED', async () => {
      const listRes = await api()
        .get(`/api/v1/groups/${groupId}/sessions?status=PLANNED`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
      const target = listRes.body[0];

      const postponeRes = await api()
        .post(`/api/v1/sessions/${target.id}/postpone`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ date: isoDate(addDays(groupStart, 6)), startTime: '19:00', durationMinutes: 30 })
        .expect(201);

      expect(postponeRes.body.status).toBe('PLANNED');
      expect(postponeRes.body.startTime).toBe('19:00');
      expect(postponeRes.body.id).not.toBe(target.id);

      const oldRes = await api()
        .get(`/api/v1/groups/${groupId}/sessions?status=POSTPONED`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
      expect(oldRes.body.some((s: { id: string }) => s.id === target.id)).toBe(true);
    });

    it('rejects postponing a session that is already POSTPONED -> 400', async () => {
      const postponedRes = await api()
        .get(`/api/v1/groups/${groupId}/sessions?status=POSTPONED`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
      const already = postponedRes.body[0];

      await api()
        .post(`/api/v1/sessions/${already.id}/postpone`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ date: isoDate(addDays(groupStart, 7)), startTime: '08:00' })
        .expect(400);
    });

    it('cancels a planned session, and refuses cancelling it twice', async () => {
      const listRes = await api()
        .get(`/api/v1/groups/${groupId}/sessions?status=PLANNED`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
      const target = listRes.body[0];

      const cancelRes = await api()
        .post(`/api/v1/sessions/${target.id}/cancel`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(201);
      expect(cancelRes.body.status).toBe('CANCELLED');

      await api()
        .post(`/api/v1/sessions/${target.id}/cancel`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(400);
    });

    it('deletes a session only while it is PLANNED', async () => {
      const cancelledRes = await api()
        .get(`/api/v1/groups/${groupId}/sessions?status=CANCELLED`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
      const cancelled = cancelledRes.body[0];

      // A cancelled session can never be deleted (ERR-SES-015).
      await api()
        .delete(`/api/v1/sessions/${cancelled.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(400);

      const plannedRes = await api()
        .get(`/api/v1/groups/${groupId}/sessions?status=PLANNED`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
      const planned = plannedRes.body[0];

      await api()
        .delete(`/api/v1/sessions/${planned.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const afterRes = await api()
        .get(`/api/v1/groups/${groupId}/sessions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
      expect(afterRes.body.some((s: { id: string }) => s.id === planned.id)).toBe(false);
    });
  });

  describe('refusals tied to group state', () => {
    it('refuses generation for a group without any weekly schedule (ERR-SES-024)', async () => {
      const group = await prisma.group.create({
        data: {
          teacherId: (await prisma.user.findUniqueOrThrow({ where: { email: teacherEmail } })).id,
          subjectId,
          schoolLevelId,
          academicYearId,
          name: `E2E-SES-${runId} Groupe Sans Planning`,
          capacity: 10,
          publicPrice: 50,
          teachingMode: 'PRESENTIAL',
          absenceBillingPolicy: 'ALL_BILLED',
          visibilityWhenFull: 'VISIBLE',
          startDate: groupStart,
          endDate: groupEnd,
          status: 'DRAFT',
        },
      });

      await api()
        .post(`/api/v1/groups/${group.id}/sessions/generate`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(400);
    });

    it('refuses generation and creation for an archived group (ERR-SES-002)', async () => {
      const group = await createGroup(`E2E-SES-${runId} Groupe Archivé`, [
        { dayOfWeek: scheduleDay1, startTime: '10:00', durationMinutes: 60 },
      ]);
      await prisma.group.update({ where: { id: group.id }, data: { status: 'ARCHIVED' } });

      await api()
        .post(`/api/v1/groups/${group.id}/sessions/generate`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(400);

      await api()
        .post(`/api/v1/groups/${group.id}/sessions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          date: isoDate(addDays(groupStart, 2)),
          startTime: '10:00',
          durationMinutes: 60,
          teachingMode: 'PRESENTIAL',
        })
        .expect(400);
    });
  });
});
