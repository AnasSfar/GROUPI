import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { grantActiveSubscription } from './helpers/grant-subscription';
import { createPendingEnrollmentDirect } from './helpers/create-enrollment';
import { registerParentDirect } from './helpers/register-parent-direct';

/**
 * E2E tests for the automatic closure cascade (Ch.12 Annexe M — ERR-INS-025/029/031):
 *  - ERR-INS-029/031 : archiving a Group auto-closes (REJECTED) any PENDING_VALIDATION enrollment
 *    still targeting it, and the Parent is notified.
 *  - ERR-INS-025 : archiving a Student auto-closes (REJECTED) any PENDING_VALIDATION enrollment
 *    still targeting them, and the Professeur is notified.
 *
 * Run against the real `groupi_test` Postgres database (see test/jest-e2e.setup.ts), mirroring the
 * fixture conventions of enrollments.e2e-spec.ts. All accounts use the `e2e-insac-` email prefix so
 * they never collide with other suites; afterAll cleans up everything created here.
 */
describe('Enrollments — clôture automatique (ERR-INS-025/029/031) (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const runId = Date.now();
  const api = () => request(app.getHttpServer());
  const password = 'CorrectHorse123';
  const today = new Date().toISOString().slice(0, 10);

  let subjectId: string;
  let schoolLevelId: string;
  let academicYearId: string;
  let schoolId: string;

  interface Actor {
    id: string;
    identifier: string;
    token: string;
  }

  async function registerAndActivate(role: 'TEACHER' | 'PARENT', label: string): Promise<Actor> {
    const identifier = `e2e-insac-${role.toLowerCase()}-${label}-${runId}`;
    let userId: string;
    if (role === 'TEACHER') {
      const res = await api()
        .post('/api/v1/auth/register')
        .send({
          password,
          firstName: 'Test',
          lastName: label,
          phone: identifier,
          city: 'Tunis',
          acceptTerms: true,
          subjectIds: [subjectId],
          schoolLevelIds: [schoolLevelId],
        })
        .expect(201);
      userId = res.body.id as string;
    } else {
      const parentSchoolLevelId = (
        await prisma.schoolLevel.findFirstOrThrow({ where: { isActive: true, code: { startsWith: 'PRIM' } } })
      ).id;
      const parentSchoolId = (await prisma.school.findFirstOrThrow({ where: { isActive: true, type: 'PRIMARY' } })).id;
      const created = await registerParentDirect(prisma, {
        phone: identifier,
        password,
        firstName: 'Test',
        lastName: label,
        city: 'Tunis',
        studentFirstName: 'Kid',
        studentLastName: label,
        schoolLevelId: parentSchoolLevelId,
        schoolId: parentSchoolId,
      });
      userId = created.userId;
    }

    await prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
    if (role === 'TEACHER') {
      await prisma.teacherProfile.update({ where: { id: userId }, data: { status: 'VALIDATED' } });
      // Ch.22 : SubscriptionGuard exige un abonnement exploitable pour créer/modifier.
      await grantActiveSubscription(prisma, userId, academicYearId);
    } else {
      await prisma.parentProfile.update({ where: { id: userId }, data: { validatedAt: new Date() } });
    }

    const loginRes = await api().post('/api/v1/auth/login').send({ identifier, password }).expect(200);
    return { id: userId, identifier, token: loginRes.body.accessToken as string };
  }

  async function createGroup(teacherToken: string, name: string, capacity: number): Promise<any> {
    const res = await api()
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name,
        subjectId,
        schoolLevelId,
        academicYearId,
        capacity,
        publicPrice: 30,
        teachingMode: 'PRESENTIAL',
        absenceBillingPolicy: 'ALL_BILLED',
        visibilityWhenFull: 'VISIBLE',
        startDate: today,
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

  /**
   * Avenant 01, Ch. C/D.2, RM-PAR-021 : `POST /enrollments` (demande d'inscription à l'initiative
   * du Parent) est supprimé — cette suite teste la cascade de clôture automatique (ERR-INS-025/
   * 029/031), pas la création de la demande elle-même : une inscription `PENDING_VALIDATION` est
   * créée directement en base (voir `helpers/create-enrollment.ts`).
   */
  function createPendingEnrollment(studentId: string, groupId: string) {
    return createPendingEnrollmentDirect(prisma, studentId, groupId);
  }

  let teacher: Actor;
  let parent: Actor;

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

    const subjectLevel = await prisma.subjectLevel.findFirst({
      where: { isAllowed: true, isActive: true },
    });
    if (!subjectLevel) {
      throw new Error(
        'Aucune combinaison matière/niveau trouvée dans groupi_test — lancez `npx prisma db seed` ' +
          'avec DATABASE_URL pointant sur groupi_test avant de lancer cette suite.',
      );
    }
    subjectId = subjectLevel.subjectId;
    schoolLevelId = subjectLevel.schoolLevelId;

    const academicYear = await prisma.academicYear.findFirst({ where: { status: 'OPEN' } });
    if (!academicYear) {
      throw new Error('Aucune année académique OPEN dans groupi_test — lancez `npx prisma db seed`.');
    }
    academicYearId = academicYear.id;

    const school = await prisma.school.findFirst({ where: { isActive: true } });
    if (!school) {
      throw new Error('Aucun établissement actif dans groupi_test — lancez `npx prisma db seed`.');
    }
    schoolId = school.id;

    teacher = await registerAndActivate('TEACHER', `t-${runId}`);
    parent = await registerAndActivate('PARENT', `p-${runId}`);
  });

  afterAll(async () => {
    const teacherIds = [teacher?.id].filter(Boolean) as string[];
    const parentIds = [parent?.id].filter(Boolean) as string[];
    const userIds = [...teacherIds, ...parentIds];

    if (userIds.length > 0) {
      const groups = await prisma.group.findMany({ where: { teacherId: { in: teacherIds } }, select: { id: true } });
      const groupIds = groups.map((g) => g.id);
      const students = await prisma.student.findMany({ where: { parentId: { in: parentIds } }, select: { id: true } });
      const studentIds = students.map((s) => s.id);

      // Ch.15 : chaque inscription active possède un compte de suivi comptable (FK stricte).
      const enrollmentsToDelete = await prisma.enrollment.findMany({
        where: { OR: [{ groupId: { in: groupIds } }, { studentId: { in: studentIds } }] },
        select: { id: true },
      });
      const accountsToDelete = await prisma.accountingAccount.findMany({
        where: { enrollmentId: { in: enrollmentsToDelete.map((e) => e.id) } },
        select: { id: true },
      });
      await prisma.accountingEntry.deleteMany({ where: { accountId: { in: accountsToDelete.map((a) => a.id) } } });
      await prisma.accountingAccount.deleteMany({ where: { id: { in: accountsToDelete.map((a) => a.id) } } });

      await prisma.enrollment.deleteMany({
        where: { OR: [{ groupId: { in: groupIds } }, { studentId: { in: studentIds } }] },
      });
      await prisma.groupSchedule.deleteMany({ where: { groupId: { in: groupIds } } });
      await prisma.group.deleteMany({ where: { id: { in: groupIds } } });

      if (studentIds.length > 0) {
        await prisma.student.updateMany({
          where: { id: { in: studentIds } },
          data: { currentSchoolSituationId: null },
        });
        await prisma.studentSchoolSituation.deleteMany({ where: { studentId: { in: studentIds } } });
        await prisma.student.deleteMany({ where: { id: { in: studentIds } } });
      }

      await prisma.activity.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.loginHistory.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.userSession.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.passwordResetToken.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.emailVerificationToken.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.phoneVerificationToken.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.subscription.deleteMany({ where: { teacherId: { in: teacherIds } } });
      await prisma.teacherSubject.deleteMany({ where: { teacherProfileId: { in: teacherIds } } });
      await prisma.teacherSchoolLevel.deleteMany({ where: { teacherProfileId: { in: teacherIds } } });
      await prisma.teacherProfile.deleteMany({ where: { id: { in: teacherIds } } });
      await prisma.parentProfile.deleteMany({ where: { id: { in: parentIds } } });
      await prisma.userDevice.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }

    await app.close();
  });

  describe('ERR-INS-029/031 : groupe archivé', () => {
    it('clôture automatiquement (REJECTED) une demande PENDING_VALIDATION et notifie le Parent, sans toucher aux inscriptions ACTIVE', async () => {
      const group = await createGroup(teacher.token, `E2E-INSAC Groupe archive ${runId}`, 2);

      // Une inscription ACTIVE dans ce même groupe : doit rester ACTIVE après l'archivage (hors scope).
      const studentActive = await createStudent(parent.token, `S-active-${runId}`);
      const activeReq = await createPendingEnrollment(studentActive.id, group.id);
      await api()
        .post(`/api/v1/groups/${group.id}/enrollments/${activeReq.id}/accept`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({})
        .expect(201);

      // Une demande encore PENDING_VALIDATION au moment de l'archivage.
      const studentPending = await createStudent(parent.token, `S-pending-${runId}`);
      const pendingReq = await createPendingEnrollment(studentPending.id, group.id);
      expect(pendingReq.status).toBe('PENDING_VALIDATION');

      // ALLOWED_TRANSITIONS impose CLOSED avant ARCHIVED.
      await api()
        .post(`/api/v1/groups/${group.id}/close`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(201);
      const archiveRes = await api()
        .post(`/api/v1/groups/${group.id}/archive`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(201);
      expect(archiveRes.body.status).toBe('ARCHIVED');

      const closedEnrollment = await prisma.enrollment.findUniqueOrThrow({ where: { id: pendingReq.id } });
      expect(closedEnrollment.status).toBe('REJECTED');
      expect(closedEnrollment.decidedById).toBeNull();
      expect(closedEnrollment.decidedAt).not.toBeNull();

      // Hors scope : l'inscription ACTIVE n'est pas touchée par la cascade.
      const untouchedEnrollment = await prisma.enrollment.findUniqueOrThrow({ where: { id: activeReq.id } });
      expect(untouchedEnrollment.status).toBe('ACTIVE');

      const activity = await prisma.activity.findFirst({
        where: { userId: parent.id, type: 'INS_AUTO_CLOSED_GROUP_ARCHIVED', refId: pendingReq.id },
        orderBy: { createdAt: 'desc' },
      });
      expect(activity).not.toBeNull();
      expect(activity?.priority).toBe('IMPORTANT');
    });
  });

  describe('ERR-INS-025 : élève archivé', () => {
    it('clôture automatiquement (REJECTED) une demande PENDING_VALIDATION et notifie le Professeur', async () => {
      const group = await createGroup(teacher.token, `E2E-INSAC Groupe eleve ${runId}`, 2);
      const student = await createStudent(parent.token, `S-arch-${runId}`);
      const reqRes = await createPendingEnrollment(student.id, group.id);
      expect(reqRes.status).toBe('PENDING_VALIDATION');

      const archiveRes = await api()
        .post(`/api/v1/parent-profile/me/students/${student.id}/archive`)
        .set('Authorization', `Bearer ${parent.token}`)
        .expect(201);
      expect(archiveRes.body.status).toBe('ARCHIVED');

      const closedEnrollment = await prisma.enrollment.findUniqueOrThrow({ where: { id: reqRes.id } });
      expect(closedEnrollment.status).toBe('REJECTED');
      expect(closedEnrollment.decidedById).toBeNull();
      expect(closedEnrollment.decidedAt).not.toBeNull();

      const activity = await prisma.activity.findFirst({
        where: { userId: teacher.id, type: 'INS_AUTO_CLOSED_STUDENT_ARCHIVED', refId: reqRes.id },
        orderBy: { createdAt: 'desc' },
      });
      expect(activity).not.toBeNull();
      expect(activity?.priority).toBe('IMPORTANT');
    });
  });
});
