import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PasswordService } from '../src/auth/password.service';

/**
 * E2E tests for Ch.17 — Exportation des données, run against the real `groupi_test` Postgres
 * database, following the same shape as accounting.e2e-spec.ts. All accounts use the `e2e-exp-`
 * email prefix; afterAll cleans up everything this file created — ExportJob/ExportAudit/
 * DataPortabilityRequest are cleaned up BEFORE deleting users (their `userId`/`requestedById` FKs
 * are RESTRICT, unlike most other FKs in this project, so order matters here too).
 */
describe('Exports (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let passwordService: PasswordService;

  const runId = Date.now();
  const api = () => request(app.getHttpServer());
  const password = 'CorrectHorse123';

  function isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
  function addDays(d: Date, days: number): Date {
    const copy = new Date(d);
    copy.setUTCDate(copy.getUTCDate() + days);
    return copy;
  }
  const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));

  let subjectId: string;
  let schoolLevelId: string;
  let academicYearId: string;
  let schoolId: string;

  interface Actor {
    id: string;
    email: string;
    token: string;
  }

  async function grantPlan(teacherId: string, planCode: 'DECOUVERTE' | 'INTERMEDIAIRE' | 'PRO'): Promise<void> {
    const plan = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { code: planCode } });
    const year = await prisma.academicYear.findUniqueOrThrow({ where: { id: academicYearId } });
    const now = new Date();
    await prisma.subscription.upsert({
      where: { teacherId_academicYearId: { teacherId, academicYearId } },
      update: { planId: plan.id, status: 'ACTIVE', activatedAt: now, expiresAt: year.endDate },
      create: { teacherId, planId: plan.id, academicYearId, status: 'ACTIVE', requestedAt: now, activatedAt: now, expiresAt: year.endDate },
    });
  }

  async function registerTeacher(label: string, planCode: 'DECOUVERTE' | 'INTERMEDIAIRE' | 'PRO'): Promise<Actor> {
    const email = `e2e-exp-teacher-${label}-${runId}@example.com`;
    const res = await api()
      .post('/api/v1/auth/register')
      .send({
        email,
        password,
        role: 'TEACHER',
        firstName: 'Test',
        lastName: label,
        phone: '20000000',
        city: 'Tunis',
        acceptTerms: true,
        subjectIds: [subjectId],
        schoolLevelIds: [schoolLevelId],
      })
      .expect(201);
    const userId = res.body.id as string;
    await prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
    await prisma.teacherProfile.update({ where: { id: userId }, data: { status: 'VALIDATED' } });
    await grantPlan(userId, planCode);
    const loginRes = await api().post('/api/v1/auth/login').send({ email, password }).expect(200);
    return { id: userId, email, token: loginRes.body.accessToken as string };
  }

  async function registerParent(label: string): Promise<Actor> {
    const email = `e2e-exp-parent-${label}-${runId}@example.com`;
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ email, password, role: 'PARENT', firstName: 'Test', lastName: label, phone: '20000000', city: 'Tunis', acceptTerms: true })
      .expect(201);
    const userId = res.body.id as string;
    await prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
    await prisma.parentProfile.update({ where: { id: userId }, data: { validatedAt: new Date() } });
    const loginRes = await api().post('/api/v1/auth/login').send({ email, password }).expect(200);
    return { id: userId, email, token: loginRes.body.accessToken as string };
  }

  async function createAdmin(label: string, permissions: string[]): Promise<Actor> {
    const email = `e2e-exp-admin-${label}-${runId}@example.com`;
    const passwordHash = await passwordService.hash(password);
    const user = await prisma.user.create({ data: { email, passwordHash, status: 'ACTIVE', roles: ['ADMIN'] } });
    await prisma.administrator.create({ data: { id: user.id, permissions, createdById: user.id } });
    const loginRes = await api().post('/api/v1/auth/login').send({ email, password }).expect(200);
    return { id: user.id, email, token: loginRes.body.accessToken as string };
  }

  async function createSuperAdmin(label: string): Promise<Actor> {
    const email = `e2e-exp-superadmin-${label}-${runId}@example.com`;
    const passwordHash = await passwordService.hash(password);
    const user = await prisma.user.create({ data: { email, passwordHash, status: 'ACTIVE', roles: ['SUPER_ADMIN'] } });
    const loginRes = await api().post('/api/v1/auth/login').send({ email, password }).expect(200);
    return { id: user.id, email, token: loginRes.body.accessToken as string };
  }

  async function createOpenGroup(teacherToken: string, name: string, publicPrice = 40): Promise<any> {
    const res = await api()
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name,
        subjectId,
        schoolLevelId,
        academicYearId,
        capacity: 10,
        publicPrice,
        teachingMode: 'PRESENTIAL',
        absenceBillingPolicy: 'ALL_BILLED',
        visibilityWhenFull: 'VISIBLE',
        startDate: isoDate(addDays(today, -30)),
        schedules: [{ dayOfWeek: 'MONDAY', startTime: '18:00', durationMinutes: 60 }],
      })
      .expect(201);
    const openRes = await api().post(`/api/v1/groups/${res.body.id}/open`).set('Authorization', `Bearer ${teacherToken}`).expect(201);
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

  async function enrollAndAccept(parentToken: string, teacherToken: string, studentId: string, groupId: string): Promise<string> {
    const reqRes = await api().post('/api/v1/enrollments').set('Authorization', `Bearer ${parentToken}`).send({ studentId, groupId }).expect(201);
    await api().post(`/api/v1/groups/${groupId}/enrollments/${reqRes.body.id}/accept`).set('Authorization', `Bearer ${teacherToken}`).send({}).expect(201);
    return reqRes.body.id as string;
  }

  async function createAndValidateSession(teacherToken: string, groupId: string, studentId: string, date: Date): Promise<string> {
    const res = await api()
      .post(`/api/v1/groups/${groupId}/sessions`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ date: isoDate(date), startTime: '08:00', durationMinutes: 60, teachingMode: 'PRESENTIAL' })
      .expect(201);
    await api().put(`/api/v1/sessions/${res.body.id}/attendance/${studentId}`).set('Authorization', `Bearer ${teacherToken}`).send({ status: 'LATE', lateDuration: 10 }).expect(200);
    await api().post(`/api/v1/sessions/${res.body.id}/attendance/validate`).set('Authorization', `Bearer ${teacherToken}`).expect(201);
    return res.body.id as string;
  }

  const cleanupTeacherIds = new Set<string>();
  const cleanupParentIds = new Set<string>();
  const cleanupAdminIds = new Set<string>();
  /** Comptes sans profil dédié (Super Admin) — nettoyés comme de simples `User`. */
  const cleanupPlainUserIds = new Set<string>();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();

    prisma = moduleFixture.get(PrismaService);
    passwordService = moduleFixture.get(PasswordService);

    const subjectLevel = await prisma.subjectLevel.findFirst({ where: { isAllowed: true, isActive: true } });
    if (!subjectLevel) throw new Error('Aucune combinaison matière/niveau trouvée dans groupi_test — lancez `npx prisma db seed`.');
    subjectId = subjectLevel.subjectId;
    schoolLevelId = subjectLevel.schoolLevelId;

    const academicYear = await prisma.academicYear.findFirst({ where: { status: 'OPEN' } });
    if (!academicYear) throw new Error('Aucune année académique OPEN dans groupi_test.');
    academicYearId = academicYear.id;

    const school = await prisma.school.findFirst({ where: { isActive: true } });
    if (!school) throw new Error('Aucun établissement actif dans groupi_test.');
    schoolId = school.id;
  });

  afterAll(async () => {
    const teacherIds = [...cleanupTeacherIds];
    const parentIds = [...cleanupParentIds];
    const adminIds = [...cleanupAdminIds];
    const plainUserIds = [...cleanupPlainUserIds];
    const allUserIds = [...teacherIds, ...parentIds, ...adminIds, ...plainUserIds];

    // Ch.17 : nettoyage AVANT suppression des users — `export_job.requested_by_id`/`export_audit.
    // user_id`/`data_portability_request.user_id` sont en RESTRICT (contrairement à la plupart des
    // FK de ce projet), contrairement au reste du schéma où SET NULL/CASCADE dominent.
    await prisma.exportAudit.deleteMany({ where: { userId: { in: allUserIds } } });
    await prisma.dataPortabilityRequest.deleteMany({ where: { userId: { in: allUserIds } } });
    await prisma.exportJob.deleteMany({ where: { requestedById: { in: allUserIds } } });

    const groups = await prisma.group.findMany({ where: { teacherId: { in: teacherIds } }, select: { id: true } });
    const groupIds = groups.map((g) => g.id);
    const enrollments = await prisma.enrollment.findMany({ where: { groupId: { in: groupIds } }, select: { id: true } });
    const enrollmentIds = enrollments.map((e) => e.id);
    const accounts = await prisma.accountingAccount.findMany({ where: { enrollmentId: { in: enrollmentIds } }, select: { id: true } });
    const accountIds = accounts.map((a) => a.id);
    await prisma.accountingEntry.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.accountingAccount.deleteMany({ where: { id: { in: accountIds } } });

    await prisma.enrollmentComment.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });

    const sessions = await prisma.session.findMany({ where: { groupId: { in: groupIds } }, select: { id: true } });
    const sessionIds = sessions.map((s) => s.id);
    const attendances = await prisma.attendance.findMany({ where: { sessionId: { in: sessionIds } }, select: { id: true } });
    const attendanceIds = attendances.map((a) => a.id);
    await prisma.attendanceHistory.deleteMany({ where: { attendanceId: { in: attendanceIds } } });
    await prisma.attendance.deleteMany({ where: { sessionId: { in: sessionIds } } });
    await prisma.session.deleteMany({ where: { id: { in: sessionIds } } });

    const students = await prisma.student.findMany({ where: { parentId: { in: parentIds } }, select: { id: true } });
    const studentIds = students.map((s) => s.id);
    await prisma.enrollment.deleteMany({ where: { groupId: { in: groupIds } } });
    await prisma.groupSchedule.deleteMany({ where: { groupId: { in: groupIds } } });
    await prisma.group.deleteMany({ where: { id: { in: groupIds } } });

    if (studentIds.length > 0) {
      await prisma.student.updateMany({ where: { id: { in: studentIds } }, data: { currentSchoolSituationId: null } });
      await prisma.studentSchoolSituation.deleteMany({ where: { studentId: { in: studentIds } } });
      await prisma.student.deleteMany({ where: { id: { in: studentIds } } });
    }

    await prisma.activity.deleteMany({ where: { userId: { in: allUserIds } } });
    await prisma.loginHistory.deleteMany({ where: { userId: { in: allUserIds } } });
    await prisma.userSession.deleteMany({ where: { userId: { in: allUserIds } } });
    await prisma.passwordResetToken.deleteMany({ where: { userId: { in: allUserIds } } });
    await prisma.emailVerificationToken.deleteMany({ where: { userId: { in: allUserIds } } });
    await prisma.subscription.deleteMany({ where: { teacherId: { in: teacherIds } } });
    await prisma.teacherSubject.deleteMany({ where: { teacherProfileId: { in: teacherIds } } });
    await prisma.teacherSchoolLevel.deleteMany({ where: { teacherProfileId: { in: teacherIds } } });
    await prisma.teacherProfile.deleteMany({ where: { id: { in: teacherIds } } });
    await prisma.parentProfile.deleteMany({ where: { id: { in: parentIds } } });
    await prisma.administrator.deleteMany({ where: { id: { in: adminIds } } });
    await prisma.user.deleteMany({ where: { id: { in: allUserIds } } });

    await app.close();
  });

  describe('RM-EXP-001 : abonnement', () => {
    it('ERR-EXP-001 : refuses any export for a Découverte teacher, and records it in the journal', async () => {
      const teacher = await registerTeacher('decouverte', 'DECOUVERTE');
      cleanupTeacherIds.add(teacher.id);

      await api()
        .post('/api/v1/exports')
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ type: 'GROUPS', format: 'CSV' })
        .expect(403);

      const audit = await prisma.exportAudit.findFirst({ where: { userId: teacher.id }, orderBy: { createdAt: 'desc' } });
      expect(audit).not.toBeNull();
      expect(audit?.outcome).toBe('REFUSED_SUBSCRIPTION');
      expect(audit?.exportJobId).toBeNull();

      // NOT-EXP-003
      const notif = await prisma.activity.findFirst({ where: { userId: teacher.id, type: 'EXP_REFUSED' } });
      expect(notif).not.toBeNull();
    });
  });

  describe('Professeur — génération et contenu (Ch.17.4)', () => {
    let teacher: Actor;
    let outsider: Actor;
    let parent: Actor;
    let groupId: string;
    let studentId: string;

    beforeAll(async () => {
      teacher = await registerTeacher(`main-${runId}`, 'INTERMEDIAIRE');
      outsider = await registerTeacher(`outsider-${runId}`, 'INTERMEDIAIRE');
      parent = await registerParent(`main-${runId}`);
      cleanupTeacherIds.add(teacher.id);
      cleanupTeacherIds.add(outsider.id);
      cleanupParentIds.add(parent.id);

      const group = await createOpenGroup(teacher.token, `E2E-EXP-${runId} Groupe`);
      groupId = group.id;
      const student = await createStudent(parent.token, `S-${runId}`);
      studentId = student.id;
      const enrollmentId = await enrollAndAccept(parent.token, teacher.token, studentId, groupId);
      await createAndValidateSession(teacher.token, groupId, studentId, addDays(today, -1));
      await api()
        .post(`/api/v1/enrollments/${enrollmentId}/accounting/payments`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ amount: 50, paymentMethod: 'Espèces' })
        .expect(201);
    });

    it('RM-EXP-004/17.6 : generates GROUPS as CSV with the GROUPI_<Type>_<Groupe>_<Date> filename', async () => {
      const res = await api()
        .post('/api/v1/exports')
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ type: 'GROUPS', format: 'CSV', groupIds: [groupId] })
        .expect(201);
      expect(res.body.status).toBe('READY');
      expect(res.body.fileName).toMatch(/^GROUPI_Groupes_.+_\d{8}\.csv$/);
      expect(res.body.rowCount).toBe(1);

      const audit = await prisma.exportAudit.findFirst({ where: { userId: teacher.id, type: 'GROUPS' }, orderBy: { createdAt: 'desc' } });
      expect(audit?.outcome).toBe('SUCCESS');
      // RM-EXP-012 : le journal ne contient jamais les données exportées elles-mêmes.
      expect(JSON.stringify(audit)).not.toContain('E2E-EXP');
    });

    it('generates STUDENTS as Excel and ATTENDANCE/LATENESS as PDF', async () => {
      const students = await api()
        .post('/api/v1/exports')
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ type: 'STUDENTS', format: 'EXCEL', groupIds: [groupId] })
        .expect(201);
      expect(students.body.fileName.endsWith('.xlsx')).toBe(true);

      const attendance = await api()
        .post('/api/v1/exports')
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ type: 'ATTENDANCE', format: 'PDF', groupIds: [groupId] })
        .expect(201);
      expect(attendance.body.rowCount).toBe(1);

      const lateness = await api()
        .post('/api/v1/exports')
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ type: 'LATENESS', format: 'PDF', groupIds: [groupId] })
        .expect(201);
      expect(lateness.body.rowCount).toBe(1);
    });

    it('generates ACCOUNTING_ACCOUNTS, PAYMENTS, STATISTICS and DASHBOARD_INDICATORS', async () => {
      const accounts = await api()
        .post('/api/v1/exports')
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ type: 'ACCOUNTING_ACCOUNTS', format: 'CSV', groupIds: [groupId] })
        .expect(201);
      expect(accounts.body.rowCount).toBe(1);

      const payments = await api()
        .post('/api/v1/exports')
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ type: 'PAYMENTS', format: 'CSV', groupIds: [groupId] })
        .expect(201);
      expect(payments.body.rowCount).toBe(1);

      const stats = await api()
        .post('/api/v1/exports')
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ type: 'STATISTICS', format: 'CSV' })
        .expect(201);
      expect(stats.body.rowCount).toBeGreaterThan(0);

      const dashboard = await api()
        .post('/api/v1/exports')
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ type: 'DASHBOARD_INDICATORS', format: 'CSV', groupIds: [groupId] })
        .expect(201);
      expect(dashboard.body.rowCount).toBe(1);
    });

    it('17.4 : commentaires pédagogiques réservés à l’offre Pro', async () => {
      await api()
        .post('/api/v1/exports')
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ type: 'PEDAGOGICAL_COMMENTS', format: 'CSV', groupIds: [groupId] })
        .expect(403);

      const proTeacher = await registerTeacher(`pro-${runId}`, 'PRO');
      cleanupTeacherIds.add(proTeacher.id);
      const proGroup = await createOpenGroup(proTeacher.token, `E2E-EXP-${runId} Groupe Pro`);
      const res = await api()
        .post('/api/v1/exports')
        .set('Authorization', `Bearer ${proTeacher.token}`)
        .send({ type: 'PEDAGOGICAL_COMMENTS', format: 'CSV', groupIds: [proGroup.id] })
        .expect(201);
      expect(res.body.rowCount).toBe(0); // ERR-EXP-002 : aucune donnée, mais export tout de même généré
    });

    it('RM-EXP-002/003 : refuses a group or student not belonging to the Professeur', async () => {
      const otherGroup = await createOpenGroup(outsider.token, `E2E-EXP-${runId} Groupe Outsider`);
      await api()
        .post('/api/v1/exports')
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ type: 'GROUPS', format: 'CSV', groupIds: [otherGroup.id] })
        .expect(403);

      const otherStudent = await createStudent(parent.token, `S-Other-${runId}`);
      await api()
        .post('/api/v1/exports')
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ type: 'STUDENTS', format: 'CSV', studentId: otherStudent.id })
        .expect(403);
    });

    it('ERR-EXP-004 : refuses ADMIN_STATISTICS/RGPD_PERSONAL_DATA for a Professeur', async () => {
      await api()
        .post('/api/v1/exports')
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ type: 'ADMIN_STATISTICS', format: 'CSV' })
        .expect(403);
    });
  });

  describe('Téléchargement et cycle de vie (RM-EXP-007/008/009/015)', () => {
    let teacher: Actor;
    let intruder: Actor;
    let jobId: string;
    let fileName: string;

    beforeAll(async () => {
      teacher = await registerTeacher(`dl-${runId}`, 'INTERMEDIAIRE');
      intruder = await registerTeacher(`dl-intruder-${runId}`, 'INTERMEDIAIRE');
      cleanupTeacherIds.add(teacher.id);
      cleanupTeacherIds.add(intruder.id);
      await createOpenGroup(teacher.token, `E2E-EXP-${runId} Groupe DL`);

      const res = await api()
        .post('/api/v1/exports')
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ type: 'GROUPS', format: 'PDF' })
        .expect(201);
      jobId = res.body.id;
      fileName = res.body.fileName;
    });

    it('RM-EXP-015 : only the author can view or download the job', async () => {
      await api().get(`/api/v1/exports/${jobId}`).set('Authorization', `Bearer ${teacher.token}`).expect(200);
      await api().get(`/api/v1/exports/${jobId}`).set('Authorization', `Bearer ${intruder.token}`).expect(403);
      await api().get(`/api/v1/exports/${jobId}/download`).set('Authorization', `Bearer ${intruder.token}`).expect(403);

      const dl = await api().get(`/api/v1/exports/${jobId}/download`).set('Authorization', `Bearer ${teacher.token}`).expect(200);
      expect(dl.headers['content-type']).toContain('application/pdf');
      expect(dl.headers['content-disposition']).toContain(fileName);
      expect(Number(dl.headers['content-length'])).toBeGreaterThan(0);
    });

    it('RM-EXP-008/ERR-EXP-006/007 : expires the job lazily once past the 7-day retention window', async () => {
      await prisma.exportJob.update({ where: { id: jobId }, data: { expiresAt: new Date(Date.now() - 1000) } });

      const res = await api().get(`/api/v1/exports/${jobId}`).set('Authorization', `Bearer ${teacher.token}`).expect(200);
      expect(res.body.status).toBe('EXPIRED');
      expect(res.body.fileBytes).toBeUndefined();

      await api().get(`/api/v1/exports/${jobId}/download`).set('Authorization', `Bearer ${teacher.token}`).expect(400);

      // NOT-EXP-006
      const notif = await prisma.activity.findFirst({ where: { userId: teacher.id, type: 'EXP_EXPIRED', refId: jobId } });
      expect(notif).not.toBeNull();
    });
  });

  describe('Parent — PDF uniquement, organisé par enfant (RM-EXP-010)', () => {
    let teacher: Actor;
    let parent: Actor;
    let studentId: string;

    beforeAll(async () => {
      teacher = await registerTeacher(`parent-scope-${runId}`, 'PRO');
      parent = await registerParent(`scope-${runId}`);
      cleanupTeacherIds.add(teacher.id);
      cleanupParentIds.add(parent.id);

      const group = await createOpenGroup(teacher.token, `E2E-EXP-${runId} Groupe Parent`);
      const student = await createStudent(parent.token, `S-Parent-${runId}`);
      studentId = student.id;
      const enrollmentId = await enrollAndAccept(parent.token, teacher.token, studentId, group.id);
      await createAndValidateSession(teacher.token, group.id, studentId, addDays(today, -1));
      await api()
        .post(`/api/v1/enrollments/${enrollmentId}/accounting/payments`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ amount: 30 })
        .expect(201);
    });

    it('ERR-EXP-003/RM-EXP-010 : refuses a non-PDF format for a Parent', async () => {
      await api()
        .post('/api/v1/exports')
        .set('Authorization', `Bearer ${parent.token}`)
        .send({ type: 'ATTENDANCE', format: 'CSV', studentId })
        .expect(400);
    });

    it('ERR-EXP-004 : refuses a type not exportable by a Parent (e.g. GROUPS)', async () => {
      await api()
        .post('/api/v1/exports')
        .set('Authorization', `Bearer ${parent.token}`)
        .send({ type: 'GROUPS', format: 'PDF' })
        .expect(403);
    });

    it('generates PDF exports for ATTENDANCE/ACCOUNTING_ACCOUNTS/PAYMENTS scoped to the Parent’s own child', async () => {
      const attendance = await api()
        .post('/api/v1/exports')
        .set('Authorization', `Bearer ${parent.token}`)
        .send({ type: 'ATTENDANCE', format: 'PDF', studentId })
        .expect(201);
      expect(attendance.body.rowCount).toBe(1);

      const accounts = await api()
        .post('/api/v1/exports')
        .set('Authorization', `Bearer ${parent.token}`)
        .send({ type: 'ACCOUNTING_ACCOUNTS', format: 'PDF' })
        .expect(201);
      expect(accounts.body.rowCount).toBe(1);

      const payments = await api()
        .post('/api/v1/exports')
        .set('Authorization', `Bearer ${parent.token}`)
        .send({ type: 'PAYMENTS', format: 'PDF' })
        .expect(201);
      expect(payments.body.rowCount).toBe(1);
    });

    it("refuses a studentId that isn't the Parent's own child", async () => {
      const otherParent = await registerParent(`other-${runId}`);
      cleanupParentIds.add(otherParent.id);
      const otherStudent = await createStudent(otherParent.token, `S-Other2-${runId}`);
      await api()
        .post('/api/v1/exports')
        .set('Authorization', `Bearer ${parent.token}`)
        .send({ type: 'ATTENDANCE', format: 'PDF', studentId: otherStudent.id })
        .expect(403);
    });
  });

  describe('Administrateur / Super Admin (Ch.17.4, PERM-EXP-001/002)', () => {
    let teacher: Actor;
    let adminWithPerms: Actor;
    let adminWithoutPerms: Actor;
    let superAdmin: Actor;

    beforeAll(async () => {
      teacher = await registerTeacher(`admin-scope-${runId}`, 'INTERMEDIAIRE');
      cleanupTeacherIds.add(teacher.id);
      await createOpenGroup(teacher.token, `E2E-EXP-${runId} Groupe Admin`);

      adminWithPerms = await createAdmin('with-perms', ['EXP_EXPORT_DATA', 'EXP_VIEW_JOURNAL']);
      adminWithoutPerms = await createAdmin('without-perms', ['REF_CREATE']);
      superAdmin = await createSuperAdmin('main');
      cleanupAdminIds.add(adminWithPerms.id);
      cleanupAdminIds.add(adminWithoutPerms.id);
      cleanupPlainUserIds.add(superAdmin.id);
    });

    it('PERM-EXP-001 : an Admin without permission cannot export, but with it can export ADMIN_STATISTICS', async () => {
      await api()
        .post('/api/v1/admin/exports')
        .set('Authorization', `Bearer ${adminWithoutPerms.token}`)
        .send({ type: 'ADMIN_STATISTICS', format: 'CSV' })
        .expect(403);

      const res = await api()
        .post('/api/v1/admin/exports')
        .set('Authorization', `Bearer ${adminWithPerms.token}`)
        .send({ type: 'ADMIN_STATISTICS', format: 'CSV' })
        .expect(201);
      expect(res.body.rowCount).toBeGreaterThan(0);
    });

    it('ERR-EXP-004 : an Admin (non Super) cannot export a Professeur-scoped type, even with EXP_EXPORT_DATA', async () => {
      await api()
        .post('/api/v1/admin/exports')
        .set('Authorization', `Bearer ${adminWithPerms.token}`)
        .send({ type: 'GROUPS', format: 'CSV' })
        .expect(403);
    });

    it('17.4 dernier § : the Super Admin can export any type, in global scope (all Professeurs)', async () => {
      const res = await api()
        .post('/api/v1/admin/exports')
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({ type: 'GROUPS', format: 'CSV' })
        .expect(201);
      expect(res.body.rowCount).toBeGreaterThanOrEqual(1);
    });

    it('PERM-EXP-002 : the export journal is accessible to the Super Admin and to a delegated Admin only', async () => {
      await api().get('/api/v1/admin/exports/journal').set('Authorization', `Bearer ${superAdmin.token}`).expect(200);
      await api().get('/api/v1/admin/exports/journal').set('Authorization', `Bearer ${adminWithPerms.token}`).expect(200);
      await api().get('/api/v1/admin/exports/journal').set('Authorization', `Bearer ${adminWithoutPerms.token}`).expect(403);
    });
  });

  describe('Portabilité RGPD (Ch.17.4 dernier §/EVT-EXP-008)', () => {
    it('lets a user request a data export, and an Admin fulfil it — downloadable by the requester', async () => {
      const parent = await registerParent(`rgpd-${runId}`);
      cleanupParentIds.add(parent.id);
      const admin = await createAdmin('rgpd', ['EXP_EXPORT_DATA']);
      cleanupAdminIds.add(admin.id);

      const created = await api().post('/api/v1/data-portability-requests').set('Authorization', `Bearer ${parent.token}`).expect(201);
      expect(created.body.status).toBe('PENDING');

      // Idempotent : une deuxième demande pendant que la première est en attente ne duplique rien.
      const again = await api().post('/api/v1/data-portability-requests').set('Authorization', `Bearer ${parent.token}`).expect(201);
      expect(again.body.id).toBe(created.body.id);

      const queue = await api().get('/api/v1/admin/data-portability-requests').set('Authorization', `Bearer ${admin.token}`).expect(200);
      expect(queue.body.some((r: any) => r.id === created.body.id)).toBe(true);

      const fulfilled = await api()
        .post(`/api/v1/admin/data-portability-requests/${created.body.id}/fulfill`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ format: 'CSV' })
        .expect(201);
      expect(fulfilled.body.status).toBe('FULFILLED');
      expect(fulfilled.body.exportJobId).toBeTruthy();

      // Le fichier appartient au titulaire des données (le Parent), pas à l'Admin qui l'a généré.
      const dl = await api()
        .get(`/api/v1/exports/${fulfilled.body.exportJobId}/download`)
        .set('Authorization', `Bearer ${parent.token}`)
        .expect(200);
      expect(dl.headers['content-type']).toContain('text/csv');
      await api()
        .get(`/api/v1/exports/${fulfilled.body.exportJobId}/download`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(403);

      await api()
        .post(`/api/v1/admin/data-portability-requests/${created.body.id}/fulfill`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(400);
    });
  });
});
