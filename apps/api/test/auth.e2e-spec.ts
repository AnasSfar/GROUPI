import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * E2E tests for the auth module (/api/v1/auth/*), run against a real Postgres database
 * (`groupi_test`, isolated from the dev `groupi` database — see test/jest-e2e.setup.ts).
 *
 * Each test uses a unique email (per-suite prefix + describe-local counter) so the suites are
 * independently re-runnable without truncating tables; afterAll additionally cleans up rows
 * created by this file's teacher account, to keep repeated local runs tidy.
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const runId = Date.now();
  const teacherEmail = `e2e-teacher-${runId}@example.com`;
  const teacherPassword = 'CorrectHorse123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    prisma = moduleFixture.get(PrismaService);
  });

  afterAll(async () => {
    // Clean up everything created under the emails used in this file so the suite can be
    // re-run indefinitely without accumulating rows or hitting unique-email conflicts.
    // Scoped to this file's own prefixes (not the broader 'e2e-') — other e2e suites
    // (enrollments: 'e2e-ins-', sessions: 'e2e-ses-', ...) also start with 'e2e-' and manage
    // their own cleanup; a broad 'e2e-' match here could try to delete their still-referenced
    // rows (e.g. a TeacherProfile with an active Group) and fail on a foreign key constraint.
    const users = await prisma.user.findMany({
      where: {
        OR: [{ email: { startsWith: 'e2e-teacher-' } }, { email: { startsWith: 'e2e-lockout-' } }],
      },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    if (userIds.length > 0) {
      await prisma.loginHistory.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.userSession.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.passwordResetToken.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.teacherProfile.deleteMany({ where: { id: { in: userIds } } });
      await prisma.parentProfile.deleteMany({ where: { id: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await app.close();
  });

  const api = () => request(app.getHttpServer());

  it('registers a teacher -> 201 PENDING_VALIDATION', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({
        email: teacherEmail,
        password: teacherPassword,
        role: 'TEACHER',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '20000000',
        city: 'Tunis',
      })
      .expect(201);

    expect(res.body).toMatchObject({
      email: teacherEmail,
      status: 'PENDING_VALIDATION',
    });
    expect(res.body.id).toEqual(expect.any(String));
  });

  it('rejects registering the same email twice -> 409', async () => {
    await api()
      .post('/api/v1/auth/register')
      .send({
        email: teacherEmail,
        password: teacherPassword,
        role: 'TEACHER',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '20000000',
        city: 'Tunis',
      })
      .expect(409);
  });

  it('logs in with correct credentials -> 200 with tokens', async () => {
    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email: teacherEmail, password: teacherPassword })
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      }),
    );
  });

  it('rejects login with the wrong password', async () => {
    await api()
      .post('/api/v1/auth/login')
      .send({ email: teacherEmail, password: 'totally-wrong' })
      .expect(401);
  });

  describe('GET /auth/me', () => {
    it('returns 200 with a valid access token', async () => {
      const loginRes = await api()
        .post('/api/v1/auth/login')
        .send({ email: teacherEmail, password: teacherPassword })
        .expect(200);

      const meRes = await api()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .expect(200);

      expect(meRes.body).toMatchObject({ email: teacherEmail, roles: ['TEACHER'] });
    });

    it('returns 401 without a token', async () => {
      await api().get('/api/v1/auth/me').expect(401);
    });

    it('returns 401 with a garbage token', async () => {
      await api()
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer not-a-real-token')
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('rotates tokens on success, and the old refresh token becomes unusable', async () => {
      const loginRes = await api()
        .post('/api/v1/auth/login')
        .send({ email: teacherEmail, password: teacherPassword })
        .expect(200);
      const oldRefreshToken = loginRes.body.refreshToken;

      const refreshRes = await api()
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(200);

      expect(refreshRes.body.refreshToken).toEqual(expect.any(String));
      expect(refreshRes.body.refreshToken).not.toBe(oldRefreshToken);

      // Reusing the old (now-rotated-away) refresh token must fail.
      await api()
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(401);

      // The new one still works.
      await api()
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: refreshRes.body.refreshToken })
        .expect(200);
    });

    it('rejects an unknown refresh token', async () => {
      await api()
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'not-a-real-refresh-token' })
        .expect(401);
    });
  });

  describe('POST /auth/logout-all', () => {
    it('revokes all sessions, so a subsequent refresh with any of them fails', async () => {
      const login1 = await api()
        .post('/api/v1/auth/login')
        .send({ email: teacherEmail, password: teacherPassword })
        .expect(200);
      const login2 = await api()
        .post('/api/v1/auth/login')
        .send({ email: teacherEmail, password: teacherPassword })
        .expect(200);

      await api()
        .post('/api/v1/auth/logout-all')
        .set('Authorization', `Bearer ${login1.body.accessToken}`)
        .expect(204);

      await api()
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: login1.body.refreshToken })
        .expect(401);

      await api()
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: login2.body.refreshToken })
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('revokes only the targeted session (idempotent)', async () => {
      const login = await api()
        .post('/api/v1/auth/login')
        .send({ email: teacherEmail, password: teacherPassword })
        .expect(200);

      await api().post('/api/v1/auth/logout').send({ refreshToken: login.body.refreshToken }).expect(204);

      await api()
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: login.body.refreshToken })
        .expect(401);

      // Idempotent: logging out again with the same (already-revoked) token still returns 204.
      await api().post('/api/v1/auth/logout').send({ refreshToken: login.body.refreshToken }).expect(204);
    });
  });

  describe('account lockout after repeated failed logins', () => {
    const lockoutEmail = `e2e-lockout-${runId}@example.com`;
    const lockoutPassword = 'CorrectHorse123';

    beforeAll(async () => {
      await api()
        .post('/api/v1/auth/register')
        .send({
          email: lockoutEmail,
          password: lockoutPassword,
          role: 'TEACHER',
          firstName: 'Lock',
          lastName: 'Out',
          phone: '20000002',
          city: 'Tunis',
        })
        .expect(201);
    });

    it('locks the account after 5 consecutive wrong-password attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await api()
          .post('/api/v1/auth/login')
          .send({ email: lockoutEmail, password: 'wrong-password' })
          .expect(401);
      }

      // Even the correct password is now rejected because the account is locked.
      const res = await api()
        .post('/api/v1/auth/login')
        .send({ email: lockoutEmail, password: lockoutPassword })
        .expect(401);

      expect(res.body.message).toMatch(/verrouill/i);
    });
  });
});
