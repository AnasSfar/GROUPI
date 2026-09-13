import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { grantActiveSubscription } from './helpers/grant-subscription';
import { createPendingEnrollmentDirect } from './helpers/create-enrollment';
import { registerParentDirect } from './helpers/register-parent-direct';

/**
 * E2E tests for the enrollments module (Ch.12 — Les Inscriptions), run against the real
 * `groupi_test` Postgres database (see test/jest-e2e.setup.ts).
 *
 * All accounts created by this file use the `e2e-ins-` email prefix so they never collide with
 * other suites (e.g. auth.e2e-spec.ts uses `e2e-`); afterAll cleans up everything created here
 * (users, profiles, students, situations, groups, enrollments) so the suite is re-runnable.
 *
 * Referential data (subjects, school levels, schools, academic year) is expected to already be
 * seeded in `groupi_test` (via `npx prisma db seed` against that database) — this suite reads it
 * rather than recreating it, since it is shared, read-only reference data (Ch.23).
 */
describe('Enrollments (e2e)', () => {
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
    const identifier = `e2eins-${role.toLowerCase()}-${label}-${runId}`;
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

  const SCHEDULE_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;
  let scheduleSeq = 0;
  function nextSchedule() {
    const seq = scheduleSeq++;
    const dayOfWeek = SCHEDULE_DAYS[seq % SCHEDULE_DAYS.length];
    const hour = 8 + (Math.floor(seq / SCHEDULE_DAYS.length) % 12);
    return { dayOfWeek, startTime: `${String(hour).padStart(2, '0')}:00`, durationMinutes: 60 };
  }

  async function createGroup(
    teacherToken: string,
    name: string,
    capacity: number,
    open: boolean,
  ): Promise<any> {
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
        schedules: [nextSchedule()],
      })
      .expect(201);
    if (!open) {
      return res.body;
    }
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
   * du Parent) est supprimé — voir le describe dédié plus bas. Les tests de ce fichier qui portent
   * sur la DÉCISION du Professeur (accept/reject/suspend/reactivate/archive) ou sur l'annulation
   * (`cancel`, conservée) ont seulement besoin d'une inscription `PENDING_VALIDATION` de départ,
   * créée ici directement en base (voir `helpers/create-enrollment.ts`).
   */
  function createPendingEnrollment(studentId: string, groupId: string) {
    return createPendingEnrollmentDirect(prisma, studentId, groupId);
  }

  let teacher1: Actor;
  let teacher2: Actor;
  let parent1: Actor;
  let parent2: Actor;

  let groupA: any; // capacity 2, open — création / doublon
  let groupB: any; // capacity 2, DRAFT — inscriptions fermées
  let groupC: any; // capacity 1, open — complet
  let groupD: any; // capacity 1, open — acceptation + cycle de vie
  let groupE: any; // capacity 2, open — refus

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

    teacher1 = await registerAndActivate('TEACHER', `t1-${runId}`);
    teacher2 = await registerAndActivate('TEACHER', `t2-${runId}`);
    parent1 = await registerAndActivate('PARENT', `p1-${runId}`);
    parent2 = await registerAndActivate('PARENT', `p2-${runId}`);

    groupA = await createGroup(teacher1.token, `E2E-INS Groupe A ${runId}`, 2, true);
    groupB = await createGroup(teacher1.token, `E2E-INS Groupe B ${runId}`, 2, false);
    groupC = await createGroup(teacher1.token, `E2E-INS Groupe C ${runId}`, 1, true);
    groupD = await createGroup(teacher1.token, `E2E-INS Groupe D ${runId}`, 1, true);
    groupE = await createGroup(teacher1.token, `E2E-INS Groupe E ${runId}`, 2, true);
  });

  afterAll(async () => {
    const teacherIds = [teacher1?.id, teacher2?.id].filter(Boolean) as string[];
    const parentIds = [parent1?.id, parent2?.id].filter(Boolean) as string[];
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

  /**
   * Avenant 01, Ch. C/D.2, RM-PAR-021, ERR-PAR-023 : la demande d'inscription à l'initiative du
   * Parent est retirée — les vérifications ERR-INS-001/002/009/016 qu'elle portait (capacité,
   * doublon, groupe non ouvert) relèvent désormais de l'affectation Professeur (Ch. C, module
   * séparé, hors périmètre de ce chantier) et ne sont donc plus testées ici.
   */
  describe('POST /enrollments (supprimé — Ch. C/D.2)', () => {
    it("l'ancienne demande d'inscription à l'initiative du Parent a été retirée -> 404 (ERR-PAR-023)", async () => {
      const student = await createStudent(parent1.token, `S-removed-${runId}`);
      await api()
        .post('/api/v1/enrollments')
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ studentId: student.id, groupId: groupA.id })
        .expect(404);
    });
  });

  describe('POST /enrollments/:id/cancel (conservé)', () => {
    let student1: any;
    let enrollment1: any;

    it('annule une demande en attente -> CANCELLED (RM-INS-038)', async () => {
      student1 = await createStudent(parent1.token, `S1-${runId}`);
      enrollment1 = await createPendingEnrollment(student1.id, groupA.id);

      const res = await api()
        .post(`/api/v1/enrollments/${enrollment1.id}/cancel`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(201);
      expect(res.body.status).toBe('CANCELLED');
    });

    it("refuse l'annulation par un autre parent -> 403/404", async () => {
      const otherStudent = await createStudent(parent1.token, `S1b-${runId}`);
      const otherEnrollment = await createPendingEnrollment(otherStudent.id, groupA.id);
      const res = await api()
        .post(`/api/v1/enrollments/${otherEnrollment.id}/cancel`)
        .set('Authorization', `Bearer ${parent2.token}`);
      expect([403, 404]).toContain(res.status);
    });

    it('refuse une seconde annulation -> 400 (ERR-INS-019)', async () => {
      const res = await api()
        .post(`/api/v1/enrollments/${enrollment1.id}/cancel`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(400);
      expect(res.body.message).toMatch(/ERR-INS-019/);
    });
  });

  describe('Décision du Professeur', () => {
    it('accepte une demande -> ACTIVE, et fait passer le groupe à FULL si la capacité est atteinte', async () => {
      const student = await createStudent(parent1.token, `S-accept-${runId}`);
      const reqRes = await createPendingEnrollment(student.id, groupD.id);

      const res = await api()
        .post(`/api/v1/groups/${groupD.id}/enrollments/${reqRes.id}/accept`)
        .set('Authorization', `Bearer ${teacher1.token}`)
        .send({ customPrice: 15 })
        .expect(201);

      expect(res.body.status).toBe('ACTIVE');
      expect(res.body.group.status).toBe('FULL'); // capacité de groupD = 1
      expect(Number(res.body.customPrice)).toBeCloseTo(15);
    });

    it('refuse une demande -> REJECTED', async () => {
      const student = await createStudent(parent1.token, `S-reject-${runId}`);
      const reqRes = await createPendingEnrollment(student.id, groupE.id);

      const res = await api()
        .post(`/api/v1/groups/${groupE.id}/enrollments/${reqRes.id}/reject`)
        .set('Authorization', `Bearer ${teacher1.token}`)
        .send({ comment: 'Groupe non adapté' })
        .expect(201);

      expect(res.body.status).toBe('REJECTED');
    });

    it("refuse l'accès à un professeur qui ne possède pas le groupe -> 403", async () => {
      await api()
        .get(`/api/v1/groups/${groupA.id}/enrollments`)
        .set('Authorization', `Bearer ${teacher2.token}`)
        .expect(403);
    });
  });

  describe('Cycle de vie (suspend / réactive / tarif / archive)', () => {
    let enrollmentId: string;

    beforeAll(async () => {
      // Réutilise groupD (capacité 1) : après le test d'acceptation ci-dessus, il est FULL avec
      // une inscription ACTIVE. On retrouve cette inscription pour la faire vivre son cycle complet.
      const list = await api()
        .get(`/api/v1/groups/${groupD.id}/enrollments`)
        .set('Authorization', `Bearer ${teacher1.token}`)
        .expect(200);
      const active = list.body.find((e: any) => e.status === 'ACTIVE');
      enrollmentId = active.id;
    });

    it('suspend une inscription active : le groupe repasse ACTIVE (une place se libère)', async () => {
      const res = await api()
        .post(`/api/v1/groups/${groupD.id}/enrollments/${enrollmentId}/suspend`)
        .set('Authorization', `Bearer ${teacher1.token}`)
        .expect(201);
      expect(res.body.status).toBe('SUSPENDED');
      expect(res.body.group.status).toBe('ACTIVE');
    });

    it('réactive une inscription suspendue : le groupe repasse FULL (la place est reconsommée)', async () => {
      const res = await api()
        .post(`/api/v1/groups/${groupD.id}/enrollments/${enrollmentId}/reactivate`)
        .set('Authorization', `Bearer ${teacher1.token}`)
        .expect(201);
      expect(res.body.status).toBe('ACTIVE');
      expect(res.body.group.status).toBe('FULL');
    });

    it('modifie le tarif personnalisé (Ch.12.8)', async () => {
      const res = await api()
        .patch(`/api/v1/groups/${groupD.id}/enrollments/${enrollmentId}`)
        .set('Authorization', `Bearer ${teacher1.token}`)
        .send({ customPrice: 22.5 })
        .expect(200);
      expect(Number(res.body.customPrice)).toBeCloseTo(22.5);
    });

    it('archive une inscription active : le groupe repasse ACTIVE (place définitivement libérée)', async () => {
      const res = await api()
        .post(`/api/v1/groups/${groupD.id}/enrollments/${enrollmentId}/archive`)
        .set('Authorization', `Bearer ${teacher1.token}`)
        .expect(201);
      expect(res.body.status).toBe('ARCHIVED');
      expect(res.body.group.status).toBe('ACTIVE');
    });

    it('refuse toute modification sur une inscription archivée -> 400 (ERR-INS-018)', async () => {
      const res = await api()
        .patch(`/api/v1/groups/${groupD.id}/enrollments/${enrollmentId}`)
        .set('Authorization', `Bearer ${teacher1.token}`)
        .send({ customPrice: 5 })
        .expect(400);
      expect(res.body.message).toMatch(/ERR-INS-018/);
    });
  });

  describe('Expiration automatique (RM-INS-026, appliquée à la lecture)', () => {
    it('transforme une demande PENDING_VALIDATION en EXPIRED après le délai de 7 jours', async () => {
      const student = await createStudent(parent1.token, `S-expire-${runId}`);
      const reqRes = await createPendingEnrollment(student.id, groupA.id);

      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      await prisma.enrollment.update({
        where: { id: reqRes.id },
        data: { requestedAt: eightDaysAgo },
      });

      const mineRes = await api()
        .get('/api/v1/enrollments/mine')
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      const expired = mineRes.body.find((e: any) => e.id === reqRes.id);
      expect(expired.status).toBe('EXPIRED');

      const persisted = await prisma.enrollment.findUniqueOrThrow({ where: { id: reqRes.id } });
      expect(persisted.status).toBe('EXPIRED');
    });
  });
});
