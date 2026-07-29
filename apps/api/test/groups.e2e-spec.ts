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
 * E2E tests for the groups module's `update()` endpoint (Ch.10 — Les Groupes), focused on the
 * ERR-GRP-016/ERR-GRP-017 gap: modifying a group's weekly `schedules` must never silently leave
 * future sessions generated from the old pattern out of sync — see `GroupsService.update`.
 *
 * Same minimal-module pattern as `sessions.e2e-spec.ts` (Prisma/Auth/Groups/Sessions), run against
 * the real Postgres `groupi_test` database. All emails use the `e2e-grp-` prefix and all fixtures
 * are `runId`-scoped so the suite is independently re-runnable and fully cleans up after itself.
 */
describe('Groups — schedule update (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const runId = Date.now();
  const teacherEmail = `e2e-grp-teacher-${runId}@example.com`;
  const password = 'CorrectHorse123';

  let teacherToken: string;
  let subjectId: string;
  let schoolLevelId: string;
  let academicYearId: string;

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
  const groupStart = today;
  const groupEnd = addDays(today, 13);
  // Ce créneau tombe forcément aujourd'hui-ou-demain : garantit au moins une séance future dans
  // la fenêtre de génération de 14 jours, quel que soit le jour de la semaine réel du run.
  const scheduleDay1 = dayOfWeekOf(today);
  const scheduleDay2 = dayOfWeekOf(addDays(today, 1));

  const api = () => request(app.getHttpServer());

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
      data: { name: `E2E GRP Subject ${runId}`, code: `E2EGRP${runId}`, isActive: true },
    });
    subjectId = subject.id;

    const schoolLevel = await prisma.schoolLevel.create({
      data: { name: `E2E GRP Level ${runId}`, code: `E2EGRPLVL${runId}`, order: 999, isActive: true },
    });
    schoolLevelId = schoolLevel.id;

    await prisma.subjectLevel.create({
      data: { subjectId, schoolLevelId, isAllowed: true, isActive: true },
    });

    const academicYear = await prisma.academicYear.create({
      data: {
        label: `E2E-GRP-${runId}`,
        startDate: addDays(today, -30),
        endDate: addDays(today, 240),
        status: 'OPEN',
      },
    });
    academicYearId = academicYear.id;

    const registerRes = await api()
      .post('/api/v1/auth/register')
      .send({
        email: teacherEmail,
        password,
        role: 'TEACHER',
        firstName: 'Prof',
        lastName: 'Groupes',
        phone: '20000002',
        city: 'Tunis',
        acceptTerms: true,
        subjectIds: [subjectId],
        schoolLevelIds: [schoolLevelId],
      })
      .expect(201);

    await prisma.teacherProfile.update({
      where: { id: registerRes.body.id },
      data: { status: 'VALIDATED' },
    });
    await grantActiveSubscription(prisma, registerRes.body.id, academicYearId);

    const loginRes = await api().post('/api/v1/auth/login').send({ email: teacherEmail, password }).expect(200);
    teacherToken = loginRes.body.accessToken as string;
  });

  afterAll(async () => {
    const users = await prisma.user.findMany({
      where: { email: { startsWith: 'e2e-grp-' } },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    await prisma.subscription.deleteMany({ where: { teacherId: { in: userIds } } });

    const groups = await prisma.group.findMany({
      where: { name: { startsWith: `E2E-GRP-${runId}` } },
      select: { id: true },
    });
    const groupIds = groups.map((g) => g.id);
    if (groupIds.length > 0) {
      await prisma.session.deleteMany({ where: { groupId: { in: groupIds } } });
      await prisma.groupSchedule.deleteMany({ where: { groupId: { in: groupIds } } });
      await prisma.group.deleteMany({ where: { id: { in: groupIds } } });
    }

    await prisma.teacherSubject.deleteMany({ where: { teacherProfileId: { in: userIds } } });
    await prisma.teacherSchoolLevel.deleteMany({ where: { teacherProfileId: { in: userIds } } });
    await prisma.subjectLevel.deleteMany({ where: { subjectId } });
    await prisma.subject.deleteMany({ where: { id: subjectId } });
    await prisma.schoolLevel.deleteMany({ where: { id: schoolLevelId } });
    await prisma.academicYear.deleteMany({ where: { id: academicYearId } });

    if (userIds.length > 0) {
      await prisma.activity.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.loginHistory.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.userSession.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.passwordResetToken.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.emailVerificationToken.deleteMany({ where: { userId: { in: userIds } } });
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

  async function generateSessions(groupId: string) {
    const res = await api()
      .post(`/api/v1/groups/${groupId}/sessions/generate`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(201);
    return res.body.sessions as { id: string; status: string }[];
  }

  it('(a) updating schedules with zero future sessions still works with no extra flag (regression)', async () => {
    const group = await createGroup(`E2E-GRP-${runId} Sans Séance`, [
      { dayOfWeek: scheduleDay1, startTime: '09:00', durationMinutes: 60 },
    ]);

    const res = await api()
      .patch(`/api/v1/groups/${group.id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ schedules: [{ dayOfWeek: scheduleDay2, startTime: '10:00', durationMinutes: 45 }] })
      .expect(200);

    expect(res.body.schedules).toHaveLength(1);
    expect(res.body.schedules[0].dayOfWeek).toBe(scheduleDay2);
    expect(res.body.schedules[0].startTime).toBe('10:00');
  });

  it('(b) updating schedules with a future PLANNED session and no keepFutureSessions -> 400 (ERR-GRP-016/017)', async () => {
    const group = await createGroup(`E2E-GRP-${runId} Refus Sans Choix`, [
      { dayOfWeek: scheduleDay1, startTime: '09:00', durationMinutes: 60 },
      { dayOfWeek: scheduleDay2, startTime: '11:00', durationMinutes: 90 },
    ]);
    const sessions = await generateSessions(group.id);
    expect(sessions.length).toBeGreaterThan(0);

    const res = await api()
      .patch(`/api/v1/groups/${group.id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ schedules: [{ dayOfWeek: scheduleDay1, startTime: '18:00', durationMinutes: 60 }] })
      .expect(400);

    expect(res.body.message).toMatch(/ERR-GRP-016/);
    expect(res.body.message).toMatch(/ERR-GRP-017/);

    // La séance générée et le planning d'origine ne doivent pas avoir bougé.
    const listRes = await api()
      .get(`/api/v1/groups/${group.id}/sessions`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);
    expect(listRes.body.map((s: { id: string }) => s.id).sort()).toEqual(
      sessions.map((s) => s.id).sort(),
    );
  });

  it('(c) keepFutureSessions: true -> 200 and the existing future session is preserved', async () => {
    const group = await createGroup(`E2E-GRP-${runId} Conserver Séances`, [
      { dayOfWeek: scheduleDay1, startTime: '09:00', durationMinutes: 60 },
      { dayOfWeek: scheduleDay2, startTime: '11:00', durationMinutes: 90 },
    ]);
    const sessions = await generateSessions(group.id);
    expect(sessions.length).toBeGreaterThan(0);

    const res = await api()
      .patch(`/api/v1/groups/${group.id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        schedules: [{ dayOfWeek: scheduleDay1, startTime: '18:00', durationMinutes: 60 }],
        keepFutureSessions: true,
      })
      .expect(200);

    expect(res.body.schedules).toHaveLength(1);

    const listRes = await api()
      .get(`/api/v1/groups/${group.id}/sessions`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);
    const remainingIds = listRes.body.map((s: { id: string }) => s.id);
    for (const s of sessions) {
      expect(remainingIds).toContain(s.id);
    }

    // Confirmation directe en base que les séances n'ont pas été touchées.
    const dbSessions = await prisma.session.findMany({
      where: { id: { in: sessions.map((s) => s.id) } },
    });
    expect(dbSessions).toHaveLength(sessions.length);
  });

  it('(d) keepFutureSessions: false -> 200 and the stale future session is removed', async () => {
    const group = await createGroup(`E2E-GRP-${runId} Supprimer Séances`, [
      { dayOfWeek: scheduleDay1, startTime: '09:00', durationMinutes: 60 },
      { dayOfWeek: scheduleDay2, startTime: '11:00', durationMinutes: 90 },
    ]);
    const sessions = await generateSessions(group.id);
    expect(sessions.length).toBeGreaterThan(0);

    const res = await api()
      .patch(`/api/v1/groups/${group.id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        schedules: [{ dayOfWeek: scheduleDay1, startTime: '18:00', durationMinutes: 60 }],
        keepFutureSessions: false,
      })
      .expect(200);

    expect(res.body.schedules).toHaveLength(1);

    const listRes = await api()
      .get(`/api/v1/groups/${group.id}/sessions`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);
    const remainingIds = listRes.body.map((s: { id: string }) => s.id);
    for (const s of sessions) {
      expect(remainingIds).not.toContain(s.id);
    }

    const dbSessions = await prisma.session.findMany({
      where: { id: { in: sessions.map((s) => s.id) } },
    });
    expect(dbSessions).toHaveLength(0);
  });
});
