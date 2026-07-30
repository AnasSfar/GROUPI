import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PreEnrollmentsModule } from '../src/pre-enrollments/pre-enrollments.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { grantActiveSubscription } from './helpers/grant-subscription';

/**
 * E2E tests for the pre-enrollments module (/api/v1/pre-enrollments/*, and
 * /api/v1/groups/:groupId/compatible-pre-enrollments), run against a real Postgres database
 * (`groupi_test`), following the same structure as test/auth.e2e-spec.ts.
 *
 * `PreEnrollmentsModule` is not wired into `AppModule` yet (another agent owns that wiring), so
 * this suite composes it alongside `AppModule` directly in the testing module — this does not
 * touch apps/api/src/app.module.ts.
 *
 * The `groupi_test` database has no seeded reference data, so this suite creates its own
 * City/Subject/SchoolLevel/School/AcademicYear fixtures directly via Prisma, all named/labelled
 * with a `runId` suffix so repeated runs never collide on unique constraints. It also bypasses
 * apps/api/src/groups/ entirely (not guaranteed to exist in this worktree) by creating Group rows
 * directly via `prisma.group.create`, and never imports anything from apps/api/src/enrollments/.
 *
 * All accounts use the `e2e-pre-` email prefix, reserved for this suite, so it never collides
 * with other agents' parallel e2e suites (e.g. Ch.12/Ch.13 use their own prefixes).
 */
describe('Pre-enrollments (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const runId = Date.now();
  const now = new Date();

  const teacherEmail = `e2e-pre-teacher-${runId}@example.com`;
  const parentEmail = `e2e-pre-parent-${runId}@example.com`;
  const otherParentEmail = `e2e-pre-parent2-${runId}@example.com`;
  const password = 'CorrectHorse123';

  let teacherId: string;
  let parentId: string;
  let otherParentId: string;
  let teacherToken: string;
  let parentToken: string;
  let otherParentToken: string;

  let cityId: string;
  let schoolId: string;
  let subjectId: string;
  let schoolLevelId: string;
  let pastYearId: string;
  let currentYearId: string;
  let futureYearId: string;

  let studentAId: string;
  let studentBId: string;

  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, PreEnrollmentsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    // --- Référentiels minimaux, propres à cette suite (runId) -------------------------------
    const city = await prisma.city.create({ data: { name: `E2E Pre City ${runId}`, isActive: true } });
    cityId = city.id;

    const school = await prisma.school.create({
      data: { name: `E2E Pre School ${runId}`, type: 'COLLEGE', cityId, isActive: true },
    });
    schoolId = school.id;

    const subject = await prisma.subject.create({
      data: { name: `E2E Pre Subject ${runId}`, code: `EPRESUB${runId}`, isActive: true },
    });
    subjectId = subject.id;

    // Code préfixé "COL" : doit matcher le type COLLEGE de `school` ci-dessus
    // (voir expectedSchoolTypeForLevelCode dans auth.service.ts), requis depuis que
    // l'inscription Parent exige un `initialStudent` cohérent avec l'établissement choisi.
    const schoolLevel = await prisma.schoolLevel.create({
      data: { name: `E2E Pre Level ${runId}`, code: `COL${runId}`, order: 1, isActive: true },
    });
    schoolLevelId = schoolLevel.id;

    const pastYear = await prisma.academicYear.create({
      data: {
        label: `E2E-PRE-PAST-${runId}`,
        startDate: new Date(now.getTime() - 400 * 86400_000),
        endDate: new Date(now.getTime() - 30 * 86400_000),
        status: 'CLOSED',
      },
    });
    pastYearId = pastYear.id;

    const currentYear = await prisma.academicYear.create({
      data: {
        label: `E2E-PRE-CURRENT-${runId}`,
        startDate: new Date(now.getTime() - 30 * 86400_000),
        endDate: new Date(now.getTime() + 300 * 86400_000),
        status: 'OPEN',
      },
    });
    currentYearId = currentYear.id;

    const futureYear = await prisma.academicYear.create({
      data: {
        label: `E2E-PRE-FUTURE-${runId}`,
        startDate: new Date(now.getTime() + 400 * 86400_000),
        endDate: new Date(now.getTime() + 700 * 86400_000),
        status: 'OPEN',
      },
    });
    futureYearId = futureYear.id;

    // --- Comptes ------------------------------------------------------------------------------
    const teacherRegister = await api()
      .post('/api/v1/auth/register')
      .send({
        email: teacherEmail,
        password,
        role: 'TEACHER',
        firstName: 'Pre',
        lastName: 'Teacher',
        phone: '20000010',
        city: city.name,
        acceptTerms: true,
        subjectIds: [subjectId],
        schoolLevelIds: [schoolLevelId],
      })
      .expect(201);
    teacherId = teacherRegister.body.id;
    // Validation du professeur : pas de flux d'admin exercé ici, mise à jour directe (comme le
    // ferait l'admin en réalité) pour pouvoir tester le module Préinscriptions en isolation.
    await prisma.teacherProfile.update({ where: { id: teacherId }, data: { status: 'VALIDATED' } });
    // Ch.22 : SubscriptionGuard exige un abonnement exploitable pour créer/modifier (ici `propose`).
    await grantActiveSubscription(prisma, teacherId, currentYearId);

    const parentRegister = await api()
      .post('/api/v1/auth/register')
      .send({
        email: parentEmail,
        password,
        role: 'PARENT',
        firstName: 'Pre',
        lastName: 'Parent',
        phone: '20000011',
        city: city.name,
        acceptTerms: true,
        initialStudent: { firstName: 'Kid', lastName: 'Parent', schoolLevelId, schoolId },
      })
      .expect(201);
    parentId = parentRegister.body.id;

    const otherParentRegister = await api()
      .post('/api/v1/auth/register')
      .send({
        email: otherParentEmail,
        password,
        role: 'PARENT',
        firstName: 'Other',
        lastName: 'Parent',
        phone: '20000012',
        city: city.name,
        acceptTerms: true,
        initialStudent: { firstName: 'Kid', lastName: 'Other', schoolLevelId, schoolId },
      })
      .expect(201);
    otherParentId = otherParentRegister.body.id;

    const teacherLogin = await api()
      .post('/api/v1/auth/login')
      .send({ email: teacherEmail, password })
      .expect(200);
    teacherToken = teacherLogin.body.accessToken;

    const parentLogin = await api()
      .post('/api/v1/auth/login')
      .send({ email: parentEmail, password })
      .expect(200);
    parentToken = parentLogin.body.accessToken;

    const otherParentLogin = await api()
      .post('/api/v1/auth/login')
      .send({ email: otherParentEmail, password })
      .expect(200);
    otherParentToken = otherParentLogin.body.accessToken;

    // --- Élèves (nécessitent une année académique OPEN, déjà créée ci-dessus) -----------------
    const studentA = await api()
      .post('/api/v1/parent-profile/me/students')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ firstName: 'Enfant', lastName: 'A', schoolLevelId, schoolId })
      .expect(201);
    studentAId = studentA.body.id;

    const studentB = await api()
      .post('/api/v1/parent-profile/me/students')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ firstName: 'Enfant', lastName: 'B', schoolLevelId, schoolId })
      .expect(201);
    studentBId = studentB.body.id;
  });

  afterAll(async () => {
    const users = await prisma.user.findMany({
      where: { email: { startsWith: 'e2e-pre-' } },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);

    const students = await prisma.student.findMany({
      where: { parentId: { in: userIds } },
      select: { id: true },
    });
    const studentIds = students.map((s) => s.id);

    const groups = await prisma.group.findMany({
      where: { teacherId: { in: userIds } },
      select: { id: true },
    });
    const groupIds = groups.map((g) => g.id);

    // Ch.15 : chaque inscription active possède un compte de suivi comptable (FK stricte).
    const enrollmentsToDelete = await prisma.enrollment.findMany({
      where: { studentId: { in: studentIds } },
      select: { id: true },
    });
    const accountsToDelete = await prisma.accountingAccount.findMany({
      where: { enrollmentId: { in: enrollmentsToDelete.map((e) => e.id) } },
      select: { id: true },
    });
    await prisma.accountingEntry.deleteMany({ where: { accountId: { in: accountsToDelete.map((a) => a.id) } } });
    await prisma.accountingAccount.deleteMany({ where: { id: { in: accountsToDelete.map((a) => a.id) } } });

    await prisma.enrollment.deleteMany({ where: { studentId: { in: studentIds } } });
    await prisma.preEnrollment.deleteMany({ where: { parentId: { in: userIds } } });
    await prisma.groupSchedule.deleteMany({ where: { groupId: { in: groupIds } } });
    await prisma.group.deleteMany({ where: { id: { in: groupIds } } });

    // Casse la référence circulaire student <-> studentSchoolSituation avant suppression.
    await prisma.student.updateMany({
      where: { id: { in: studentIds } },
      data: { currentSchoolSituationId: null },
    });
    await prisma.studentSchoolSituation.deleteMany({ where: { studentId: { in: studentIds } } });
    await prisma.student.deleteMany({ where: { id: { in: studentIds } } });

    // Ch.22 : FK RESTRICT sur subscription.{teacher_id,academic_year_id} — doit précéder la
    // suppression de l'année académique et du professeur ci-dessous.
    await prisma.subscription.deleteMany({ where: { teacherId: { in: userIds } } });

    // Nettoyage des référentiels créés par cette suite AVANT les Users : si une étape suivante
    // (ex. user.deleteMany) échoue pour une raison quelconque, ces lignes ne doivent jamais rester
    // orphelines (elles ont empoisonné une exécution passée du fait de l'ordre inverse — voir
    // l'incident documenté dans l'historique de ce fichier).
    await prisma.academicYear.deleteMany({
      where: { id: { in: [pastYearId, currentYearId, futureYearId] } },
    });
    await prisma.teacherSubject.deleteMany({ where: { teacherProfileId: { in: userIds } } });
    await prisma.teacherSchoolLevel.deleteMany({ where: { teacherProfileId: { in: userIds } } });
    await prisma.school.deleteMany({ where: { id: schoolId } });
    await prisma.city.deleteMany({ where: { id: cityId } });
    await prisma.subject.deleteMany({ where: { id: subjectId } });
    await prisma.schoolLevel.deleteMany({ where: { id: schoolLevelId } });

    await prisma.activity.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.loginHistory.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userSession.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.passwordResetToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.emailVerificationToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.teacherProfile.deleteMany({ where: { id: { in: userIds } } });
    await prisma.parentProfile.deleteMany({ where: { id: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });

    await app.close();
  });

  let preEnrollmentAId: string;

  it('creates a valid pre-enrollment -> 201 PENDING', async () => {
    const res = await api()
      .post('/api/v1/pre-enrollments')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        studentId: studentAId,
        teacherId,
        schoolLevelId,
        subjectId,
        academicYearId: futureYearId,
      })
      .expect(201);

    expect(res.body).toMatchObject({ status: 'PENDING', studentId: studentAId, teacherId });
    preEnrollmentAId = res.body.id;
  });

  it('rejects creation for the current academic year (RM-PRE-023)', async () => {
    await api()
      .post('/api/v1/pre-enrollments')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ studentId: studentBId, teacherId, schoolLevelId, academicYearId: currentYearId })
      .expect(400);
  });

  it('rejects creation for a past academic year (RM-PRE-023)', async () => {
    await api()
      .post('/api/v1/pre-enrollments')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ studentId: studentBId, teacherId, schoolLevelId, academicYearId: pastYearId })
      .expect(400);
  });

  it('rejects a duplicate pre-enrollment for the same student/teacher/year (RM-PRE-025)', async () => {
    await api()
      .post('/api/v1/pre-enrollments')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        studentId: studentAId,
        teacherId,
        schoolLevelId,
        subjectId,
        academicYearId: futureYearId,
      })
      .expect(400);
  });

  it("rejects a stranger parent's attempt to act on this pre-enrollment -> 403", async () => {
    await api()
      .post(`/api/v1/pre-enrollments/${preEnrollmentAId}/cancel`)
      .set('Authorization', `Bearer ${otherParentToken}`)
      .expect(403);
  });

  it('lets the parent cancel a PENDING pre-enrollment (RM-PRE-020)', async () => {
    const res = await api()
      .post(`/api/v1/pre-enrollments/${preEnrollmentAId}/cancel`)
      .set('Authorization', `Bearer ${parentToken}`)
      .expect(201);
    expect(res.body.status).toBe('CANCELLED');
  });

  it('rejects cancelling an already-cancelled pre-enrollment (ERR-PRE-017)', async () => {
    await api()
      .post(`/api/v1/pre-enrollments/${preEnrollmentAId}/cancel`)
      .set('Authorization', `Bearer ${parentToken}`)
      .expect(400);
  });

  describe('proposal -> confirmation -> transformation', () => {
    let preEnrollmentBId: string;
    let groupId: string;

    beforeAll(async () => {
      // studentA's previous pre-enrollment is CANCELLED, so a new one for the same
      // student/teacher/year is allowed again.
      const created = await api()
        .post('/api/v1/pre-enrollments')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          studentId: studentAId,
          teacherId,
          schoolLevelId,
          subjectId,
          academicYearId: futureYearId,
        })
        .expect(201);
      preEnrollmentBId = created.body.id;

      const group = await prisma.group.create({
        data: {
          teacherId,
          subjectId,
          schoolLevelId,
          academicYearId: futureYearId,
          name: `E2E Pre Group ${runId}`,
          capacity: 1,
          publicPrice: 100,
          teachingMode: 'PRESENTIAL',
          absenceBillingPolicy: 'ALL_BILLED',
          visibilityWhenFull: 'VISIBLE',
          startDate: new Date(now.getTime() + 410 * 86400_000),
          status: 'ACTIVE',
        },
      });
      groupId = group.id;
    });

    it('lists this pre-enrollment as compatible with the freshly created group', async () => {
      const res = await api()
        .get(`/api/v1/groups/${groupId}/compatible-pre-enrollments`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
      expect(res.body.map((pe: { id: string }) => pe.id)).toContain(preEnrollmentBId);
    });

    it('lets the teacher send a proposal -> PROPOSAL_SENT', async () => {
      const expiresAt = new Date(now.getTime() + 5 * 86400_000).toISOString();
      const res = await api()
        .post(`/api/v1/pre-enrollments/${preEnrollmentBId}/propose`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ groupId, expiresAt })
        .expect(201);
      expect(res.body.status).toBe('PROPOSAL_SENT');
      expect(res.body.proposedGroupId).toBe(groupId);
    });

    it('confirms the proposal -> TRANSFORMED, and creates a PENDING_VALIDATION Enrollment', async () => {
      const res = await api()
        .post(`/api/v1/pre-enrollments/${preEnrollmentBId}/confirm`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(201);
      expect(res.body.status).toBe('TRANSFORMED');

      const enrollment = await prisma.enrollment.findFirst({
        where: { studentId: studentAId, groupId, status: 'PENDING_VALIDATION' },
      });
      expect(enrollment).not.toBeNull();
    });
  });

  describe('confirmation refused when the group is already full (ERR-PRE-004/011)', () => {
    let preEnrollmentCId: string;
    let fullGroupId: string;

    beforeAll(async () => {
      const created = await api()
        .post('/api/v1/pre-enrollments')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          studentId: studentBId,
          teacherId,
          schoolLevelId,
          subjectId,
          academicYearId: futureYearId,
        })
        .expect(201);
      preEnrollmentCId = created.body.id;

      const group = await prisma.group.create({
        data: {
          teacherId,
          subjectId,
          schoolLevelId,
          academicYearId: futureYearId,
          name: `E2E Pre Full Group ${runId}`,
          capacity: 1,
          publicPrice: 100,
          teachingMode: 'PRESENTIAL',
          absenceBillingPolicy: 'ALL_BILLED',
          visibilityWhenFull: 'VISIBLE',
          startDate: new Date(now.getTime() + 410 * 86400_000),
          status: 'ACTIVE',
        },
      });
      fullGroupId = group.id;

      // Occupies the group's only seat directly (bypassing the enrollments module entirely).
      await prisma.enrollment.create({
        data: {
          studentId: studentBId,
          groupId: fullGroupId,
          status: 'ACTIVE',
          requestedAt: new Date(),
        },
      });

      const expiresAt = new Date(now.getTime() + 5 * 86400_000).toISOString();
      await api()
        .post(`/api/v1/pre-enrollments/${preEnrollmentCId}/propose`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ groupId: fullGroupId, expiresAt })
        .expect(201);
    });

    it('refuses confirmation and leaves the pre-enrollment PROPOSAL_SENT', async () => {
      await api()
        .post(`/api/v1/pre-enrollments/${preEnrollmentCId}/confirm`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(400);

      const mine = await api()
        .get('/api/v1/pre-enrollments/mine')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);
      const found = mine.body.find((pe: { id: string }) => pe.id === preEnrollmentCId);
      expect(found.status).toBe('PROPOSAL_SENT');
    });
  });

  describe('lazy expiration', () => {
    it('flips an overdue PROPOSAL_SENT to EXPIRED on read (no cron in this project)', async () => {
      // studentA now only has a TRANSFORMED pre-enrollment for this teacher/year, so a new one
      // is allowed (RM-PRE-025 only restricts *active* statuses).
      const created = await api()
        .post('/api/v1/pre-enrollments')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          studentId: studentAId,
          teacherId,
          schoolLevelId,
          subjectId,
          academicYearId: futureYearId,
        })
        .expect(201);
      const preEnrollmentDId = created.body.id;

      const group = await prisma.group.create({
        data: {
          teacherId,
          subjectId,
          schoolLevelId,
          academicYearId: futureYearId,
          name: `E2E Pre Expiry Group ${runId}`,
          capacity: 5,
          publicPrice: 100,
          teachingMode: 'PRESENTIAL',
          absenceBillingPolicy: 'ALL_BILLED',
          visibilityWhenFull: 'VISIBLE',
          startDate: new Date(now.getTime() + 410 * 86400_000),
          status: 'ACTIVE',
        },
      });

      // The API refuses a past expiresAt on /propose, so send a near-future one first...
      const soon = new Date(now.getTime() + 60_000).toISOString();
      await api()
        .post(`/api/v1/pre-enrollments/${preEnrollmentDId}/propose`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ groupId: group.id, expiresAt: soon })
        .expect(201);

      // ...then push it into the past directly, simulating the deadline having elapsed.
      await prisma.preEnrollment.update({
        where: { id: preEnrollmentDId },
        data: { expiresAt: new Date(now.getTime() - 60_000) },
      });

      const mine = await api()
        .get('/api/v1/pre-enrollments/mine')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);
      const found = mine.body.find((pe: { id: string }) => pe.id === preEnrollmentDId);
      expect(found.status).toBe('EXPIRED');

      // And confirming it now fails with ERR-PRE-005.
      await api()
        .post(`/api/v1/pre-enrollments/${preEnrollmentDId}/confirm`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(400);
    });
  });

  describe('teacher view', () => {
    it('lists received pre-enrollments, filterable by academic year', async () => {
      const res = await api()
        .get(`/api/v1/pre-enrollments/mine?academicYearId=${futureYearId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.every((pe: { academicYearId: string }) => pe.academicYearId === futureYearId)).toBe(
        true,
      );
    });
  });
});
