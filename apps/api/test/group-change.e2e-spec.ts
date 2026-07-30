import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { grantActiveSubscription } from './helpers/grant-subscription';

/**
 * E2E tests for the group-change module (Ch.12.12 — Changement de groupe, variante définitive),
 * run against the real `groupi_test` Postgres database — same shape as attendance.e2e-spec.ts /
 * enrollments.e2e-spec.ts. All accounts use the `e2e-gch-` email prefix.
 */
describe('Group change (e2e)', () => {
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
    const email = `e2e-gch-${role.toLowerCase()}-${label}-${runId}@example.com`;
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

  async function createOpenGroup(teacherToken: string, name: string, capacity: number): Promise<any> {
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

  let teacherA: Actor; // groupe d'origine
  let teacherB: Actor; // groupe cible
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

    teacherA = await registerAndActivate('TEACHER', `a-${runId}`);
    teacherB = await registerAndActivate('TEACHER', `b-${runId}`);
    parent1 = await registerAndActivate('PARENT', `p1-${runId}`);
    parent2 = await registerAndActivate('PARENT', `p2-${runId}`);
  });

  afterAll(async () => {
    const teacherIds = [teacherA.id, teacherB.id];
    const parentIds = [parent1.id, parent2.id];

    const groups = await prisma.group.findMany({ where: { teacherId: { in: teacherIds } }, select: { id: true } });
    const groupIds = groups.map((g) => g.id);

    const students = await prisma.student.findMany({ where: { parentId: { in: parentIds } }, select: { id: true } });
    const studentIds = students.map((s) => s.id);

    const enrollments = await prisma.enrollment.findMany({
      where: { OR: [{ groupId: { in: groupIds } }, { studentId: { in: studentIds } }] },
      select: { id: true },
    });
    const enrollmentIds = enrollments.map((e) => e.id);

    await prisma.groupChangeRequest.deleteMany({ where: { originalEnrollmentId: { in: enrollmentIds } } });
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

  describe('happy path — changement immédiat', () => {
    it('accepts a change and immediately archives the original enrollment, activating the new one', async () => {
      const groupA = await createOpenGroup(teacherA.token, `E2E-GCH-${runId} Groupe A`, 10);
      const groupA2 = await createOpenGroup(teacherA.token, `E2E-GCH-${runId} Groupe A2 happy`, 10);
      const student = await createStudent(parent1.token, `Happy-${runId}`);
      const originalEnrollmentId = await enrollAndAccept(parent1.token, teacherA.token, student.id, groupA.id);

      const createRes = await api()
        .post('/api/v1/group-changes')
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ enrollmentId: originalEnrollmentId, targetGroupId: groupA2.id })
        .expect(201);
      expect(createRes.body.status).toBe('PENDING');
      const requestId = createRes.body.id as string;

      const acceptRes = await api()
        .post(`/api/v1/group-changes/${requestId}/accept`)
        .set('Authorization', `Bearer ${teacherA.token}`)
        .send({ effectiveDate: isoDate(today) })
        .expect(201);
      expect(acceptRes.body.status).toBe('ACCEPTED');
      expect(acceptRes.body.newEnrollment.status).toBe('ACTIVE');

      const originalEnrollment = await prisma.enrollment.findUniqueOrThrow({ where: { id: originalEnrollmentId } });
      expect(originalEnrollment.status).toBe('ARCHIVED');

      const newEnrollment = await prisma.enrollment.findUniqueOrThrow({
        where: { id: acceptRes.body.newEnrollment.id },
      });
      expect(newEnrollment.status).toBe('ACTIVE');
      expect(newEnrollment.groupId).toBe(groupA2.id);
    });
  });

  describe('refusals', () => {
    it('refuses creation when the target group belongs to a different Professeur (RM-CHG-010/ERR-CHG-008)', async () => {
      const groupA = await createOpenGroup(teacherA.token, `E2E-GCH-${runId} Groupe A crossteacher`, 10);
      const groupB = await createOpenGroup(teacherB.token, `E2E-GCH-${runId} Groupe B crossteacher`, 10);
      const student = await createStudent(parent1.token, `CrossTeacher-${runId}`);
      const originalEnrollmentId = await enrollAndAccept(parent1.token, teacherA.token, student.id, groupA.id);

      await api()
        .post('/api/v1/group-changes')
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ enrollmentId: originalEnrollmentId, targetGroupId: groupB.id })
        .expect(400);
    });

    it('refuses acceptance when the target group is full (ERR-INS-012)', async () => {
      const groupA = await createOpenGroup(teacherA.token, `E2E-GCH-${runId} Groupe A full`, 10);
      const groupAFull = await createOpenGroup(teacherA.token, `E2E-GCH-${runId} Groupe A2 full`, 1);

      const filler = await createStudent(parent2.token, `Filler-${runId}`);
      await enrollAndAccept(parent2.token, teacherA.token, filler.id, groupAFull.id);

      const student = await createStudent(parent1.token, `Blocked-${runId}`);
      const originalEnrollmentId = await enrollAndAccept(parent1.token, teacherA.token, student.id, groupA.id);

      const createRes = await api()
        .post('/api/v1/group-changes')
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ enrollmentId: originalEnrollmentId, targetGroupId: groupAFull.id })
        .expect(201);

      await api()
        .post(`/api/v1/group-changes/${createRes.body.id}/accept`)
        .set('Authorization', `Bearer ${teacherA.token}`)
        .send({ effectiveDate: isoDate(today) })
        .expect(400);
    });

    it('refuses an effective date earlier than today (ERR-CHG-009)', async () => {
      const groupA = await createOpenGroup(teacherA.token, `E2E-GCH-${runId} Groupe A pastdate`, 10);
      const groupA2 = await createOpenGroup(teacherA.token, `E2E-GCH-${runId} Groupe A2 pastdate`, 10);
      const student = await createStudent(parent1.token, `PastDate-${runId}`);
      const originalEnrollmentId = await enrollAndAccept(parent1.token, teacherA.token, student.id, groupA.id);

      const createRes = await api()
        .post('/api/v1/group-changes')
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ enrollmentId: originalEnrollmentId, targetGroupId: groupA2.id })
        .expect(201);

      await api()
        .post(`/api/v1/group-changes/${createRes.body.id}/accept`)
        .set('Authorization', `Bearer ${teacherA.token}`)
        .send({ effectiveDate: isoDate(addDays(today, -1)) })
        .expect(400);
    });

    it('refuses acceptance/rejection from a teacher who does not own the target group -> 403', async () => {
      const groupA = await createOpenGroup(teacherA.token, `E2E-GCH-${runId} Groupe A outsider`, 10);
      const groupA2 = await createOpenGroup(teacherA.token, `E2E-GCH-${runId} Groupe A2 outsider`, 10);
      const student = await createStudent(parent1.token, `Outsider-${runId}`);
      const originalEnrollmentId = await enrollAndAccept(parent1.token, teacherA.token, student.id, groupA.id);

      const createRes = await api()
        .post('/api/v1/group-changes')
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ enrollmentId: originalEnrollmentId, targetGroupId: groupA2.id })
        .expect(201);

      await api()
        .post(`/api/v1/group-changes/${createRes.body.id}/accept`)
        .set('Authorization', `Bearer ${teacherB.token}`)
        .send({ effectiveDate: isoDate(today) })
        .expect(403);
    });

    it('rejects a request, leaving the original enrollment untouched', async () => {
      const groupA = await createOpenGroup(teacherA.token, `E2E-GCH-${runId} Groupe A reject`, 10);
      const groupA2 = await createOpenGroup(teacherA.token, `E2E-GCH-${runId} Groupe A2 reject`, 10);
      const student = await createStudent(parent1.token, `Reject-${runId}`);
      const originalEnrollmentId = await enrollAndAccept(parent1.token, teacherA.token, student.id, groupA.id);

      const createRes = await api()
        .post('/api/v1/group-changes')
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ enrollmentId: originalEnrollmentId, targetGroupId: groupA2.id })
        .expect(201);

      const rejectRes = await api()
        .post(`/api/v1/group-changes/${createRes.body.id}/reject`)
        .set('Authorization', `Bearer ${teacherA.token}`)
        .send({ reason: 'Pas de place pédagogique' })
        .expect(201);
      expect(rejectRes.body.status).toBe('REJECTED');
      expect(rejectRes.body.rejectionReason).toBe('Pas de place pédagogique');

      const originalEnrollment = await prisma.enrollment.findUniqueOrThrow({ where: { id: originalEnrollmentId } });
      expect(originalEnrollment.status).toBe('ACTIVE');
    });

    it('lets the parent cancel a pending request, blocking any later decision', async () => {
      const groupA = await createOpenGroup(teacherA.token, `E2E-GCH-${runId} Groupe A cancel`, 10);
      const groupA2 = await createOpenGroup(teacherA.token, `E2E-GCH-${runId} Groupe A2 cancel`, 10);
      const student = await createStudent(parent1.token, `Cancel-${runId}`);
      const originalEnrollmentId = await enrollAndAccept(parent1.token, teacherA.token, student.id, groupA.id);

      const createRes = await api()
        .post('/api/v1/group-changes')
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ enrollmentId: originalEnrollmentId, targetGroupId: groupA2.id })
        .expect(201);

      await api()
        .post(`/api/v1/group-changes/${createRes.body.id}/cancel`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(201);

      await api()
        .post(`/api/v1/group-changes/${createRes.body.id}/accept`)
        .set('Authorization', `Bearer ${teacherA.token}`)
        .send({ effectiveDate: isoDate(today) })
        .expect(400);
    });

    it('lets the parent cancel an accepted-but-not-yet-effective change, freeing the seat it took (ERR-CHG-012)', async () => {
      const groupA = await createOpenGroup(teacherA.token, `E2E-GCH-${runId} Groupe A delai`, 10);
      const groupA2 = await createOpenGroup(teacherA.token, `E2E-GCH-${runId} Groupe A2 delai`, 1);
      const student = await createStudent(parent1.token, `Delai-${runId}`);
      const originalEnrollmentId = await enrollAndAccept(parent1.token, teacherA.token, student.id, groupA.id);

      const createRes = await api()
        .post('/api/v1/group-changes')
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ enrollmentId: originalEnrollmentId, targetGroupId: groupA2.id })
        .expect(201);

      const acceptRes = await api()
        .post(`/api/v1/group-changes/${createRes.body.id}/accept`)
        .set('Authorization', `Bearer ${teacherA.token}`)
        .send({ effectiveDate: isoDate(addDays(today, 5)) })
        .expect(201);
      const newEnrollmentId = acceptRes.body.newEnrollment.id as string;

      const groupAfterAccept = await prisma.group.findUniqueOrThrow({ where: { id: groupA2.id } });
      expect(groupAfterAccept.status).toBe('FULL');

      const cancelRes = await api()
        .post(`/api/v1/group-changes/${createRes.body.id}/cancel`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(201);
      expect(cancelRes.body.status).toBe('CANCELLED');

      const cancelledEnrollment = await prisma.enrollment.findUniqueOrThrow({ where: { id: newEnrollmentId } });
      expect(cancelledEnrollment.status).toBe('CANCELLED');

      const account = await prisma.accountingAccount.findUnique({ where: { enrollmentId: newEnrollmentId } });
      expect(account).toBeNull();

      const groupAfterCancel = await prisma.group.findUniqueOrThrow({ where: { id: groupA2.id } });
      expect(groupAfterCancel.status).toBe('ACTIVE');

      // L'inscription d'origine n'a jamais été touchée puisque la date d'effet n'était pas atteinte.
      const originalEnrollment = await prisma.enrollment.findUniqueOrThrow({ where: { id: originalEnrollmentId } });
      expect(originalEnrollment.status).toBe('ACTIVE');
    });

    it('refuses cancellation once the change has already applied (ERR-CHG-012)', async () => {
      const groupA = await createOpenGroup(teacherA.token, `E2E-GCH-${runId} Groupe A hors-delai`, 10);
      const groupA2 = await createOpenGroup(teacherA.token, `E2E-GCH-${runId} Groupe A2 hors-delai`, 10);
      const student = await createStudent(parent1.token, `HorsDelai-${runId}`);
      const originalEnrollmentId = await enrollAndAccept(parent1.token, teacherA.token, student.id, groupA.id);

      const createRes = await api()
        .post('/api/v1/group-changes')
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ enrollmentId: originalEnrollmentId, targetGroupId: groupA2.id })
        .expect(201);

      await api()
        .post(`/api/v1/group-changes/${createRes.body.id}/accept`)
        .set('Authorization', `Bearer ${teacherA.token}`)
        .send({ effectiveDate: isoDate(today) })
        .expect(201);

      await api()
        .post(`/api/v1/group-changes/${createRes.body.id}/cancel`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(400);
    });
  });

  describe('date effective future — application paresseuse', () => {
    it('keeps the original enrollment ACTIVE until the effective date, then archives it lazily on read', async () => {
      const groupA = await createOpenGroup(teacherA.token, `E2E-GCH-${runId} Groupe A lazy`, 10);
      const groupA2 = await createOpenGroup(teacherA.token, `E2E-GCH-${runId} Groupe A2 lazy`, 10);
      const student = await createStudent(parent1.token, `Lazy-${runId}`);
      const originalEnrollmentId = await enrollAndAccept(parent1.token, teacherA.token, student.id, groupA.id);

      const createRes = await api()
        .post('/api/v1/group-changes')
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ enrollmentId: originalEnrollmentId, targetGroupId: groupA2.id })
        .expect(201);

      const acceptRes = await api()
        .post(`/api/v1/group-changes/${createRes.body.id}/accept`)
        .set('Authorization', `Bearer ${teacherA.token}`)
        .send({ effectiveDate: isoDate(addDays(today, 5)) })
        .expect(201);
      expect(acceptRes.body.status).toBe('ACCEPTED');

      const stillActive = await prisma.enrollment.findUniqueOrThrow({ where: { id: originalEnrollmentId } });
      expect(stillActive.status).toBe('ACTIVE');

      // Simule le passage du temps jusqu'à la date effective (pas de job planifié dans ce projet).
      await prisma.groupChangeRequest.update({
        where: { id: createRes.body.id },
        data: { effectiveDate: addDays(today, -1) },
      });

      await api()
        .get('/api/v1/group-changes/mine')
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);

      const archivedNow = await prisma.enrollment.findUniqueOrThrow({ where: { id: originalEnrollmentId } });
      expect(archivedNow.status).toBe('ARCHIVED');
    });
  });
});
