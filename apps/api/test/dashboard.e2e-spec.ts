import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PasswordService } from '../src/auth/password.service';
import { grantActiveSubscription } from './helpers/grant-subscription';

/**
 * E2E tests for the dashboards module (Ch.16 — Les tableaux de bord), run against the real
 * `groupi_test` Postgres database — same shape as accounting.e2e-spec.ts/subscriptions.e2e-spec.ts.
 * All accounts use the `e2e-dsh-` email prefix; afterAll cleans up everything this file created.
 */
describe('Dashboards (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let passwordService: PasswordService;

  const runId = Date.now();
  const api = () => request(app.getHttpServer());
  const password = 'CorrectHorse123';
  const now = new Date();

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
  const today = dateOnly(now);

  let subjectId: string;
  let schoolLevelId: string;
  let academicYearId: string;
  let futureYearId: string;
  let schoolId: string;

  interface Actor {
    id: string;
    email: string;
    token: string;
  }

  async function registerAndActivate(role: 'TEACHER' | 'PARENT', label: string, skipSubscription = false): Promise<Actor> {
    const email = `e2e-dsh-${role.toLowerCase()}-${label}-${runId}@example.com`;
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
      if (!skipSubscription) await grantActiveSubscription(prisma, userId, academicYearId);
    } else {
      await prisma.parentProfile.update({ where: { id: userId }, data: { validatedAt: new Date() } });
    }

    const loginRes = await api().post('/api/v1/auth/login').send({ email, password }).expect(200);
    return { id: userId, email, token: loginRes.body.accessToken as string };
  }

  /** Découverte (isTrial) active — statistiques/export doivent rester indisponibles (RM-DSH-011/012). */
  async function grantTrialSubscription(teacherId: string): Promise<void> {
    const trial = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { code: 'DECOUVERTE' } });
    const year = await prisma.academicYear.findUniqueOrThrow({ where: { id: academicYearId } });
    await prisma.subscription.upsert({
      where: { teacherId_academicYearId: { teacherId, academicYearId } },
      update: { status: 'ACTIVE', planId: trial.id, activatedAt: now, expiresAt: year.endDate },
      create: {
        teacherId,
        planId: trial.id,
        academicYearId,
        status: 'ACTIVE',
        requestedAt: now,
        activatedAt: now,
        expiresAt: year.endDate,
      },
    });
  }

  async function createAdmin(label: string, permissions: string[]): Promise<Actor> {
    const email = `e2e-dsh-admin-${label}-${runId}@example.com`;
    const passwordHash = await passwordService.hash(password);
    const user = await prisma.user.create({ data: { email, passwordHash, status: 'ACTIVE', roles: ['ADMIN'] } });
    await prisma.administrator.create({ data: { id: user.id, permissions, createdById: user.id } });
    const loginRes = await api().post('/api/v1/auth/login').send({ email, password }).expect(200);
    return { id: user.id, email, token: loginRes.body.accessToken as string };
  }

  async function createSuperAdmin(label: string): Promise<Actor> {
    const email = `e2e-dsh-superadmin-${label}-${runId}@example.com`;
    const passwordHash = await passwordService.hash(password);
    const user = await prisma.user.create({ data: { email, passwordHash, status: 'ACTIVE', roles: ['SUPER_ADMIN'] } });
    const loginRes = await api().post('/api/v1/auth/login').send({ email, password }).expect(200);
    return { id: user.id, email, token: loginRes.body.accessToken as string };
  }

  async function createOpenGroup(
    teacherToken: string,
    name: string,
    opts: { capacity?: number; publicPrice?: number; abandonmentThreshold?: number; debtAlertThresholdSessions?: number } = {},
  ): Promise<any> {
    const res = await api()
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name,
        subjectId,
        schoolLevelId,
        academicYearId,
        capacity: opts.capacity ?? 4,
        publicPrice: opts.publicPrice ?? 40,
        teachingMode: 'PRESENTIAL',
        absenceBillingPolicy: 'ALL_BILLED',
        abandonmentThreshold: opts.abandonmentThreshold ?? 1,
        debtAlertThresholdSessions: opts.debtAlertThresholdSessions ?? 1,
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

  async function createSession(teacherToken: string, groupId: string, date: Date, startTime = '08:00'): Promise<any> {
    const res = await api()
      .post(`/api/v1/groups/${groupId}/sessions`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ date: isoDate(date), startTime, durationMinutes: 60, teachingMode: 'PRESENTIAL' })
      .expect(201);
    return res.body;
  }

  async function validateSession(teacherToken: string, sessionId: string, studentId: string, status: string) {
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

  let teacher1: Actor; // PRO actif, statistiques/export disponibles
  let teacher2: Actor; // Découverte actif, statistiques/export indisponibles
  let parent1: Actor; // deux enfants
  let parent2: Actor; // un enfant, non lié aux groupes de teacher1
  let pendingUser: { id: string; email: string };
  let adminNoPerm: Actor;
  let adminFullPerm: Actor;
  let superAdmin: Actor;
  let superAdminTarget: Actor;

  let student1: any;
  let student2: any; // deuxième enfant de parent1
  let groupNeedsStudents: string;
  let groupFull: string;
  let debtEnrollmentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();

    prisma = moduleFixture.get(PrismaService);
    passwordService = moduleFixture.get(PasswordService);

    const subjectLevel = await prisma.subjectLevel.findFirst({ where: { isAllowed: true, isActive: true } });
    if (!subjectLevel) {
      throw new Error('Aucune combinaison matière/niveau trouvée dans groupi_test — lancez `npx prisma db seed`.');
    }
    subjectId = subjectLevel.subjectId;
    schoolLevelId = subjectLevel.schoolLevelId;

    const academicYear = await prisma.academicYear.findFirst({ where: { status: 'OPEN' } });
    if (!academicYear) throw new Error('Aucune année académique OPEN dans groupi_test.');
    academicYearId = academicYear.id;

    const school = await prisma.school.findFirst({ where: { isActive: true } });
    if (!school) throw new Error('Aucun établissement actif dans groupi_test.');
    schoolId = school.id;

    teacher1 = await registerAndActivate('TEACHER', `main-${runId}`);
    teacher2 = await registerAndActivate('TEACHER', `trial-${runId}`, true);
    await grantTrialSubscription(teacher2.id);
    parent1 = await registerAndActivate('PARENT', `p1-${runId}`);
    parent2 = await registerAndActivate('PARENT', `p2-${runId}`);

    const pendingRes = await api()
      .post('/api/v1/auth/register')
      .send({
        email: `e2e-dsh-pending-${runId}@example.com`,
        password,
        role: 'TEACHER',
        firstName: 'Pending',
        lastName: 'User',
        phone: '20000000',
        city: 'Tunis',
        acceptTerms: true,
        subjectIds: [subjectId],
        schoolLevelIds: [schoolLevelId],
      })
      .expect(201);
    pendingUser = { id: pendingRes.body.id, email: `e2e-dsh-pending-${runId}@example.com` };

    adminNoPerm = await createAdmin('none', []);
    adminFullPerm = await createAdmin('full', ['ACC_VALIDATE', 'SCH_VALIDATE', 'ABO_VALIDATE', 'AUDIT_VIEW']);
    superAdmin = await createSuperAdmin('main');
    superAdminTarget = await createSuperAdmin('target');

    student1 = await createStudent(parent1.token, `Un-${runId}`);
    student2 = await createStudent(parent1.token, `Deux-${runId}`);
    const student2Bis = await createStudent(parent2.token, `P2-${runId}`);
    void student2Bis;

    // Créée après les élèves : `StudentService.create` choisit l'année OPEN la plus récente pour
    // la première situation scolaire (voir student.service.ts) — une année future créée plus tôt
    // aurait été choisie à la place de `academicYearId`, cassant ERR-INS-027 à l'inscription.
    const futureYear = await prisma.academicYear.create({
      data: {
        label: `E2E-DSH-FUTURE-${runId}`,
        startDate: new Date(now.getTime() + 400 * 86400_000),
        endDate: new Date(now.getTime() + 700 * 86400_000),
        status: 'OPEN',
      },
    });
    futureYearId = futureYear.id;

    groupNeedsStudents = (await createOpenGroup(teacher1.token, `GRP-NEEDS-${runId}`, { capacity: 4 })).id;
    groupFull = (await createOpenGroup(teacher1.token, `GRP-FULL-${runId}`, { capacity: 1, publicPrice: 40 })).id;

    await enrollAndAccept(parent1.token, teacher1.token, student1.id, groupNeedsStudents);
    debtEnrollmentId = await enrollAndAccept(parent1.token, teacher1.token, student2.id, groupFull);

    // Deux séances passées, absence non excusée facturée à chaque fois : déclenche à la fois
    // l'alerte d'abandon (seuil 1) et l'alerte de compte débiteur (seuil 1 séance, 2 facturées).
    const session1 = await createSession(teacher1.token, groupFull, today, '08:00');
    await validateSession(teacher1.token, session1.id, student2.id, 'UNEXCUSED_ABSENT');
    const session2 = await createSession(teacher1.token, groupFull, today, '09:00');
    await validateSession(teacher1.token, session2.id, student2.id, 'UNEXCUSED_ABSENT');
  });

  afterAll(async () => {
    const teacherIds = [teacher1.id, teacher2.id];
    const parentIds = [parent1.id, parent2.id];
    const adminIds = [adminNoPerm.id, adminFullPerm.id];
    const superAdminIds = [superAdmin.id, superAdminTarget.id];

    const groups = await prisma.group.findMany({ where: { teacherId: { in: teacherIds } }, select: { id: true } });
    const groupIds = groups.map((g) => g.id);
    const sessions = await prisma.session.findMany({ where: { groupId: { in: groupIds } }, select: { id: true } });
    const sessionIds = sessions.map((s) => s.id);

    await prisma.absenceNotice.deleteMany({ where: { sessionId: { in: sessionIds } } });

    const enrollments = await prisma.enrollment.findMany({ where: { groupId: { in: groupIds } }, select: { id: true } });
    const enrollmentIds = enrollments.map((e) => e.id);
    const accounts = await prisma.accountingAccount.findMany({
      where: { enrollmentId: { in: enrollmentIds } },
      select: { id: true },
    });
    const accountIds = accounts.map((a) => a.id);
    await prisma.accountingEntry.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.accountingAccount.deleteMany({ where: { id: { in: accountIds } } });

    const attendances = await prisma.attendance.findMany({ where: { sessionId: { in: sessionIds } }, select: { id: true } });
    const attendanceIds = attendances.map((a) => a.id);
    await prisma.attendanceHistory.deleteMany({ where: { attendanceId: { in: attendanceIds } } });
    await prisma.attendance.deleteMany({ where: { sessionId: { in: sessionIds } } });
    await prisma.session.deleteMany({ where: { id: { in: sessionIds } } });

    await prisma.enrollmentComment.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
    await prisma.enrollment.deleteMany({ where: { groupId: { in: groupIds } } });
    await prisma.groupSchedule.deleteMany({ where: { groupId: { in: groupIds } } });
    await prisma.group.deleteMany({ where: { id: { in: groupIds } } });

    const students = await prisma.student.findMany({ where: { parentId: { in: parentIds } }, select: { id: true } });
    const studentIds = students.map((s) => s.id);
    await prisma.preEnrollment.deleteMany({ where: { OR: [{ teacherId: { in: teacherIds } }, { studentId: { in: studentIds } }] } });
    if (studentIds.length > 0) {
      await prisma.student.updateMany({ where: { id: { in: studentIds } }, data: { currentSchoolSituationId: null } });
      await prisma.studentSchoolSituation.deleteMany({ where: { studentId: { in: studentIds } } });
      await prisma.student.deleteMany({ where: { id: { in: studentIds } } });
    }

    await prisma.subscription.deleteMany({ where: { teacherId: { in: teacherIds } } });
    await prisma.academicYear.deleteMany({ where: { id: futureYearId } });

    const allUserIds = [...teacherIds, ...parentIds, ...adminIds, ...superAdminIds, pendingUser.id];
    await prisma.activity.deleteMany({ where: { userId: { in: allUserIds } } });
    await prisma.loginHistory.deleteMany({ where: { userId: { in: allUserIds } } });
    await prisma.userSession.deleteMany({ where: { userId: { in: allUserIds } } });
    await prisma.passwordResetToken.deleteMany({ where: { userId: { in: allUserIds } } });
    await prisma.emailVerificationToken.deleteMany({ where: { userId: { in: allUserIds } } });
    await prisma.teacherSubject.deleteMany({ where: { teacherProfileId: { in: [...teacherIds, pendingUser.id] } } });
    await prisma.teacherSchoolLevel.deleteMany({ where: { teacherProfileId: { in: [...teacherIds, pendingUser.id] } } });
    await prisma.teacherProfile.deleteMany({ where: { id: { in: [...teacherIds, pendingUser.id] } } });
    await prisma.parentProfile.deleteMany({ where: { id: { in: parentIds } } });
    await prisma.administrator.deleteMany({ where: { id: { in: adminIds } } });
    await prisma.user.deleteMany({ where: { id: { in: allUserIds } } });

    await app.close();
  });

  describe('Tableau de bord Professeur (Ch.16.3)', () => {
    it('agrège activité/présences/comptabilité/paiements/groupes/profil (RM-DSH-004)', async () => {
      const res = await api()
        .get('/api/v1/dashboard/teacher')
        .set('Authorization', `Bearer ${teacher1.token}`)
        .expect(200);

      expect(res.body.activity.activeGroupsCount).toBeGreaterThanOrEqual(2);
      expect(res.body.activity.totalActiveStudents).toBeGreaterThanOrEqual(2);
      expect(typeof res.body.accounting.forecastRevenue).toBe('number');

      const groups: any[] = res.body.groups;
      const needsStudents = groups.find((g) => g.id === groupNeedsStudents);
      expect(needsStudents.category).toBe('NEEDS_STUDENTS');
      const full = groups.find((g) => g.id === groupFull);
      expect(full.category).toBe('FULL');

      expect(res.body.presences.abandonmentAlerts.length).toBeGreaterThanOrEqual(1);
      expect(res.body.presences.abandonmentAlerts.some((a: any) => a.enrollmentId === debtEnrollmentId)).toBe(true);

      const debtor = res.body.payments.debtorAccounts.find((d: any) => d.account.enrollmentId === debtEnrollmentId);
      expect(debtor).toBeDefined();
      expect(debtor.alert).toBe(true);
      expect(debtor.balance).toBeLessThan(0);

      expect(res.body.profile.completenessScore).toBeGreaterThanOrEqual(0);

      const alertCodes = res.body.alerts.map((a: any) => a.code);
      expect(alertCodes).toEqual(
        expect.arrayContaining(['GROUPS_FULL', 'GROUPS_NEED_STUDENTS', 'ABANDONMENT_RISK', 'DEBTOR_ACCOUNT']),
      );
    });

    it('statistiques avancées disponibles à partir de l’offre Intermédiaire (RM-DSH-011)', async () => {
      const paid = await api().get('/api/v1/dashboard/teacher').set('Authorization', `Bearer ${teacher1.token}`).expect(200);
      expect(paid.body.statistics.available).toBe(true);
      expect(paid.body.export.available).toBe(true);

      const trial = await api().get('/api/v1/dashboard/teacher').set('Authorization', `Bearer ${teacher2.token}`).expect(200);
      expect(trial.body.statistics.available).toBe(false);
      expect(typeof trial.body.statistics.message).toBe('string');
      expect(trial.body.export.available).toBe(false);
    });

    it('préinscriptions reçues et en attente (Ch.16.3)', async () => {
      await api()
        .post('/api/v1/pre-enrollments')
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ studentId: student1.id, teacherId: teacher1.id, schoolLevelId, subjectId, academicYearId: futureYearId })
        .expect(201);

      const res = await api().get('/api/v1/dashboard/teacher').set('Authorization', `Bearer ${teacher1.token}`).expect(200);
      expect(res.body.preEnrollments.receivedCount).toBeGreaterThanOrEqual(1);
      expect(res.body.preEnrollments.pendingCount).toBeGreaterThanOrEqual(1);
    });

    it('alerte d’abonnement arrivant à échéance', async () => {
      await prisma.subscription.updateMany({
        where: { teacherId: teacher1.id },
        data: { expiresAt: addDays(now, 5) },
      });
      const res = await api().get('/api/v1/dashboard/teacher').set('Authorization', `Bearer ${teacher1.token}`).expect(200);
      expect(res.body.alerts.some((a: any) => a.code === 'SUBSCRIPTION_EXPIRING')).toBe(true);
    });

    it('refuse un Parent (ERR-DSH-005, RolesGuard)', async () => {
      await api().get('/api/v1/dashboard/teacher').set('Authorization', `Bearer ${parent1.token}`).expect(403);
    });

    it('refuse un utilisateur non authentifié (ERR-DSH-001)', async () => {
      await api().get('/api/v1/dashboard/teacher').expect(401);
    });
  });

  describe('Tableau de bord Parent (Ch.16.4)', () => {
    it('vue consolidée par enfant, précise l’enfant concerné (RM-DSH-005)', async () => {
      const res = await api().get('/api/v1/dashboard/parent').set('Authorization', `Bearer ${parent1.token}`).expect(200);
      expect(res.body.multipleChildren).toBe(true);
      expect(res.body.children.length).toBe(2);
      const childWithDebt = res.body.children.find((c: any) => c.student.id === student2.id);
      expect(childWithDebt.globalBalance).toBeLessThan(0);
      expect(res.body.alerts.some((a: any) => a.code === 'CHILD_DEBTOR_BALANCE')).toBe(true);
    });

    it('refuse un Professeur (ERR-DSH-005)', async () => {
      await api().get('/api/v1/dashboard/parent').set('Authorization', `Bearer ${teacher1.token}`).expect(403);
    });
  });

  describe('Signalement d’absence (Ch.16.4/RM-DSH-006)', () => {
    let futureSessionId: string;

    beforeAll(async () => {
      const session = await createSession(teacher1.token, groupNeedsStudents, addDays(today, 3), '10:00');
      futureSessionId = session.id;
    });

    it('le Parent signale une absence avant le début de la séance (EVT-DSH-007)', async () => {
      const res = await api()
        .post(`/api/v1/sessions/${futureSessionId}/absence-notices`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ studentId: student1.id, reason: 'Rendez-vous médical' })
        .expect(201);
      expect(res.body.studentId).toBe(student1.id);
      expect(res.body.reason).toBe('Rendez-vous médical');

      const teacherView = await api()
        .get(`/api/v1/sessions/${futureSessionId}/absence-notices`)
        .set('Authorization', `Bearer ${teacher1.token}`)
        .expect(200);
      expect(teacherView.body.length).toBe(1);
      expect(teacherView.body[0].student.id).toBe(student1.id);

      const parentDashboard = await api()
        .get('/api/v1/dashboard/parent')
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      const child = parentDashboard.body.children.find((c: any) => c.student.id === student1.id);
      const session = child.upcomingSessions.find((s: any) => s.id === futureSessionId);
      expect(session.absenceReported).toBe(true);
    });

    it('notifie immédiatement le Professeur', async () => {
      const res = await api()
        .get('/api/v1/notifications/me')
        .set('Authorization', `Bearer ${teacher1.token}`)
        .expect(200);
      expect(res.body.some((a: any) => a.type === 'DSH_ABSENCE_NOTICE' && a.refId === futureSessionId)).toBe(true);
    });

    it('refuse un Parent qui n’est pas celui de l’élève', async () => {
      await api()
        .post(`/api/v1/sessions/${futureSessionId}/absence-notices`)
        .set('Authorization', `Bearer ${parent2.token}`)
        .send({ studentId: student1.id })
        .expect(403);
    });

    it('refuse hors délai, une fois la séance commencée (ERR-DSH-007)', async () => {
      const pastSession = await prisma.session.create({
        data: {
          groupId: groupNeedsStudents,
          date: addDays(today, -1),
          startTime: '08:00',
          durationMinutes: 60,
          teachingMode: 'PRESENTIAL',
          status: 'PLANNED',
        },
      });
      await api()
        .post(`/api/v1/sessions/${pastSession.id}/absence-notices`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ studentId: student1.id })
        .expect(400);
      await prisma.session.delete({ where: { id: pastSession.id } });
    });
  });

  describe('Tableau de bord Administrateur / Super Administrateur (Ch.16.5/16.6)', () => {
    it('masque les sections sans permission (ERR-DSH-002)', async () => {
      const res = await api().get('/api/v1/dashboard/admin').set('Authorization', `Bearer ${adminNoPerm.token}`).expect(200);
      expect(res.body.overview).toBeDefined();
      expect(res.body.referentials).toBeDefined();
      expect(res.body.pendingAccountValidations).toBeNull();
      expect(res.body.pendingSchoolSituations).toBeNull();
      expect(res.body.subscriptions).toBeNull();
      expect(res.body.auditLog).toBeNull();
    });

    it('affiche les sections autorisées (RM-DSH-007)', async () => {
      await api()
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${teacher2.token}`)
        .send({ planId: (await prisma.subscriptionPlan.findUniqueOrThrow({ where: { code: 'INTERMEDIAIRE' } })).id, academicYearId: futureYearId })
        .expect(201);

      const res = await api().get('/api/v1/dashboard/admin').set('Authorization', `Bearer ${adminFullPerm.token}`).expect(200);
      expect(res.body.pendingAccountValidations).not.toBeNull();
      expect(res.body.pendingAccountValidations.some((u: any) => u.email === pendingUser.email)).toBe(true);
      expect(res.body.subscriptions).not.toBeNull();
      expect(res.body.subscriptions.pendingPaymentCount).toBeGreaterThanOrEqual(1);
      expect(res.body.auditLog).not.toBeNull();
      expect(res.body.alerts.some((a: any) => a.code === 'PENDING_ACCOUNT_VALIDATIONS')).toBe(true);
      expect(res.body.alerts.some((a: any) => a.code === 'PENDING_SUBSCRIPTION_VALIDATIONS')).toBe(true);
    });

    it('vision complète du Super Admin, sans filtrage (Ch.16.6)', async () => {
      const res = await api().get('/api/v1/dashboard/super-admin').set('Authorization', `Bearer ${superAdmin.token}`).expect(200);
      expect(res.body.pendingAccountValidations).not.toBeNull();
      expect(res.body.subscriptions).not.toBeNull();
      expect(typeof res.body.totalAdminsCount).toBe('number');
    });

    it('un Admin ne peut pas accéder au tableau de bord Super Admin (RolesGuard)', async () => {
      await api().get('/api/v1/dashboard/super-admin').set('Authorization', `Bearer ${adminFullPerm.token}`).expect(403);
    });

    it('RM-DSH-008 : le Super Admin consulte en lecture seule le tableau de bord d’un autre utilisateur', async () => {
      const teacherView = await api()
        .get(`/api/v1/dashboard/users/${teacher1.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .expect(200);
      expect(teacherView.body.role).toBe('TEACHER');
      expect(teacherView.body.dashboard.activity).toBeDefined();

      const parentView = await api()
        .get(`/api/v1/dashboard/users/${parent1.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .expect(200);
      expect(parentView.body.role).toBe('PARENT');

      const adminView = await api()
        .get(`/api/v1/dashboard/users/${adminFullPerm.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .expect(200);
      expect(adminView.body.role).toBe('ADMIN');
      expect(adminView.body.dashboard.pendingAccountValidations).not.toBeNull();
    });

    it('personne ne peut consulter le tableau de bord du Super Admin (RM-DSH-008)', async () => {
      await api()
        .get(`/api/v1/dashboard/users/${superAdminTarget.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .expect(403);
    });

    it('un Admin (non Super Admin) ne peut pas consulter le tableau de bord d’un autre utilisateur (ERR-DSH-005)', async () => {
      await api()
        .get(`/api/v1/dashboard/users/${teacher1.id}`)
        .set('Authorization', `Bearer ${adminFullPerm.token}`)
        .expect(403);
    });
  });
});
