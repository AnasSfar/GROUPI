import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * E2E tests for the admin-only academic year creation endpoint (PERM-REF-001), run against the
 * real `groupi_test` Postgres database. Mirrors the shape of the other e2e suites; uses the
 * `e2e-year-` email prefix.
 */
describe('Academic year creation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const runId = Date.now();
  const api = () => request(app.getHttpServer());
  const password = 'CorrectHorse123';

  function addDays(d: Date, days: number): Date {
    const copy = new Date(d);
    copy.setUTCDate(copy.getUTCDate() + days);
    return copy;
  }
  function isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  let superAdminToken: string;
  let teacherToken: string;
  let subjectId: string;
  let schoolLevelId: string;
  const createdAcademicYearIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    const superAdminEmail = `e2e-year-superadmin-${runId}@example.com`;
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await prisma.user.create({
      data: { email: superAdminEmail, passwordHash, status: 'ACTIVE', roles: ['SUPER_ADMIN'] },
    });
    const superAdminLogin = await api()
      .post('/api/v1/auth/login')
      .send({ email: superAdminEmail, password })
      .expect(200);
    superAdminToken = superAdminLogin.body.accessToken as string;

    const subject = await prisma.subject.create({
      data: { name: `E2E YEAR Subject ${runId}`, code: `E2EYEAR${runId}`, isActive: true },
    });
    subjectId = subject.id;

    const schoolLevel = await prisma.schoolLevel.create({
      data: { name: `E2E YEAR Level ${runId}`, code: `E2EYEARLVL${runId}`, order: 999, isActive: true },
    });
    schoolLevelId = schoolLevel.id;

    const teacherEmail = `e2e-year-teacher-${runId}@example.com`;
    const registerRes = await api()
      .post('/api/v1/auth/register')
      .send({
        email: teacherEmail,
        password,
        role: 'TEACHER',
        firstName: 'Prof',
        lastName: 'AnnÉe',
        phone: '20000002',
        city: 'Tunis',
        acceptTerms: true,
        subjectIds: [subjectId],
        schoolLevelIds: [schoolLevelId],
      })
      .expect(201);
    await prisma.user.update({ where: { id: registerRes.body.id }, data: { status: 'ACTIVE' } });
    const teacherLogin = await api().post('/api/v1/auth/login').send({ email: teacherEmail, password }).expect(200);
    teacherToken = teacherLogin.body.accessToken as string;
  });

  afterAll(async () => {
    await prisma.academicYear.deleteMany({ where: { id: { in: createdAcademicYearIds } } });

    const users = await prisma.user.findMany({ where: { email: { startsWith: 'e2e-year-' } }, select: { id: true } });
    const userIds = users.map((u) => u.id);
    if (userIds.length > 0) {
      await prisma.loginHistory.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.userSession.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.emailVerificationToken.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.teacherSubject.deleteMany({ where: { teacherProfileId: { in: userIds } } });
      await prisma.teacherSchoolLevel.deleteMany({ where: { teacherProfileId: { in: userIds } } });
      await prisma.teacherProfile.deleteMany({ where: { id: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }

    await prisma.subject.deleteMany({ where: { id: subjectId } });
    await prisma.schoolLevel.deleteMany({ where: { id: schoolLevelId } });

    await app.close();
  });

  it('rejects creation from a non-admin role -> 403', async () => {
    await api()
      .post('/api/v1/referentials/academic-years')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ label: `E2E-YEAR-${runId}-forbidden`, startDate: '2099-09-01', endDate: '2100-07-01' })
      .expect(403);
  });

  it('creates a new OPEN academic year as Super Admin', async () => {
    const res = await api()
      .post('/api/v1/referentials/academic-years')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ label: `E2E-YEAR-${runId}`, startDate: '2099-09-01', endDate: '2100-07-01' })
      .expect(201);
    expect(res.body.status).toBe('OPEN');
    expect(res.body.label).toBe(`E2E-YEAR-${runId}`);
    createdAcademicYearIds.push(res.body.id);

    const listRes = await api()
      .get('/api/v1/referentials/academic-years')
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);
    expect(listRes.body.some((y: { id: string }) => y.id === res.body.id)).toBe(true);
  });

  it('rejects a duplicate label', async () => {
    await api()
      .post('/api/v1/referentials/academic-years')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ label: `E2E-YEAR-${runId}`, startDate: '2101-09-01', endDate: '2102-07-01' })
      .expect(400);
  });

  it('rejects an overlapping period', async () => {
    await api()
      .post('/api/v1/referentials/academic-years')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ label: `E2E-YEAR-${runId}-overlap`, startDate: '2099-12-01', endDate: '2100-12-01' })
      .expect(400);
  });

  it('rejects an end date before the start date', async () => {
    await api()
      .post('/api/v1/referentials/academic-years')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ label: `E2E-YEAR-${runId}-invalid`, startDate: '2100-01-01', endDate: '2099-01-01' })
      .expect(400);
  });

  it('rejects when unauthenticated -> 401', async () => {
    await api()
      .post('/api/v1/referentials/academic-years')
      .send({ label: `E2E-YEAR-${runId}-anon`, startDate: isoDate(addDays(new Date(), 400)), endDate: isoDate(addDays(new Date(), 700)) })
      .expect(401);
  });
});
