import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PasswordService } from '../src/auth/password.service';
import { grantActiveSubscription } from './helpers/grant-subscription';

/**
 * E2E tests for the accounting engine (Ch.15 — Le moteur comptable), run against the real
 * `groupi_test` Postgres database, following the same shape as attendance.e2e-spec.ts.
 *
 * All accounts use the `e2e-cpt-` email prefix; afterAll cleans up everything this file created.
 * The "compte verrouillé" suite locks a single account directly via Prisma rather than mutating
 * the shared seeded AccountingPeriod, so it never affects any other suite.
 */
describe('Accounting (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let passwordService: PasswordService;

  const runId = Date.now();
  const api = () => request(app.getHttpServer());
  const password = 'CorrectHorse123';
  const ENTRY_NUMBER_RE = /^ECR-\d{4}-\d{6}$/;

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
    const email = `e2e-cpt-${role.toLowerCase()}-${label}-${runId}@example.com`;
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
      await grantActiveSubscription(prisma, userId, academicYearId);
    } else {
      await prisma.parentProfile.update({ where: { id: userId }, data: { validatedAt: new Date() } });
    }

    const loginRes = await api().post('/api/v1/auth/login').send({ email, password }).expect(200);
    return { id: userId, email, token: loginRes.body.accessToken as string };
  }

  async function createAdmin(permissions: string[]): Promise<Actor> {
    const email = `e2e-cpt-admin-${permissions.join('-')}-${runId}@example.com`;
    const passwordHash = await passwordService.hash(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, status: 'ACTIVE', roles: ['ADMIN'] },
    });
    await prisma.administrator.create({ data: { id: user.id, permissions, createdById: user.id } });
    const loginRes = await api().post('/api/v1/auth/login').send({ email, password }).expect(200);
    return { id: user.id, email, token: loginRes.body.accessToken as string };
  }

  async function createOpenGroup(
    teacherToken: string,
    name: string,
    opts: { publicPrice?: number; debtAlertThresholdSessions?: number; academicYearId?: string } = {},
  ): Promise<any> {
    const res = await api()
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name,
        subjectId,
        schoolLevelId,
        academicYearId: opts.academicYearId ?? academicYearId,
        capacity: 10,
        publicPrice: opts.publicPrice ?? 40,
        teachingMode: 'PRESENTIAL',
        absenceBillingPolicy: 'ALL_BILLED',
        debtAlertThresholdSessions: opts.debtAlertThresholdSessions ?? 4,
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

  async function createSession(teacherToken: string, groupId: string, date: Date): Promise<any> {
    const res = await api()
      .post(`/api/v1/groups/${groupId}/sessions`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ date: isoDate(date), startTime: '08:00', durationMinutes: 60, teachingMode: 'PRESENTIAL' })
      .expect(201);
    return res.body;
  }

  async function validateSession(
    teacherToken: string,
    sessionId: string,
    studentId: string,
    status: 'PRESENT' | 'UNEXCUSED_ABSENT' = 'PRESENT',
  ): Promise<void> {
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

  async function getAccount(token: string, enrollmentId: string) {
    const res = await api()
      .get(`/api/v1/enrollments/${enrollmentId}/accounting`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    return res.body;
  }

  let teacher: Actor;
  let outsider: Actor;
  let parent1: Actor;
  let parent2: Actor;
  let admin: Actor;

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
      throw new Error(
        'Aucune combinaison matière/niveau trouvée dans groupi_test — lancez `npx prisma db seed` avant cette suite.',
      );
    }
    subjectId = subjectLevel.subjectId;
    schoolLevelId = subjectLevel.schoolLevelId;

    const academicYear = await prisma.academicYear.findFirst({ where: { status: 'OPEN' } });
    if (!academicYear) throw new Error('Aucune année académique OPEN dans groupi_test.');
    academicYearId = academicYear.id;

    const school = await prisma.school.findFirst({ where: { isActive: true } });
    if (!school) throw new Error('Aucun établissement actif dans groupi_test.');
    schoolId = school.id;

    teacher = await registerAndActivate('TEACHER', `main-${runId}`);
    outsider = await registerAndActivate('TEACHER', `outsider-${runId}`);
    parent1 = await registerAndActivate('PARENT', `p1-${runId}`);
    parent2 = await registerAndActivate('PARENT', `p2-${runId}`);
    admin = await createAdmin(['CPT_ADMIN_ADJUST', 'REF_CREATE']);
  });

  afterAll(async () => {
    const teacherIds = [teacher.id, outsider.id];
    const parentIds = [parent1.id, parent2.id];

    const groups = await prisma.group.findMany({ where: { teacherId: { in: teacherIds } }, select: { id: true } });
    const groupIds = groups.map((g) => g.id);
    const enrollments = await prisma.enrollment.findMany({ where: { groupId: { in: groupIds } }, select: { id: true } });
    const enrollmentIds = enrollments.map((e) => e.id);
    const accounts = await prisma.accountingAccount.findMany({
      where: { enrollmentId: { in: enrollmentIds } },
      select: { id: true },
    });
    const accountIds = accounts.map((a) => a.id);
    await prisma.accountingEntry.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.accountingAccount.deleteMany({ where: { id: { in: accountIds } } });

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

    const userIds = [...teacherIds, ...parentIds, admin.id];
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
    await prisma.administrator.deleteMany({ where: { id: admin.id } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });

    await app.close();
  });

  describe('création du compte et paiements', () => {
    let groupId: string;
    let studentId: string;
    let enrollmentId: string;

    beforeAll(async () => {
      const group = await createOpenGroup(teacher.token, `E2E-CPT-${runId} Groupe Paiements`, { publicPrice: 40 });
      groupId = group.id;
      const s = await createStudent(parent1.token, `S-Pay-${runId}`);
      studentId = s.id;
      enrollmentId = await enrollAndAccept(parent1.token, teacher.token, studentId, groupId);
    });

    it('RM-CPT-002 : creates the account automatically at activation, CREATED, balance 0', async () => {
      const body = await getAccount(teacher.token, enrollmentId);
      expect(body.account.status).toBe('CREATED');
      expect(body.indicators.currentBalance).toBe(0);
      expect(body.entries).toHaveLength(0);
    });

    it('refuses access to a teacher who does not own the group -> 403', async () => {
      await api()
        .get(`/api/v1/enrollments/${enrollmentId}/accounting`)
        .set('Authorization', `Bearer ${outsider.token}`)
        .expect(403);
      await api()
        .post(`/api/v1/enrollments/${enrollmentId}/accounting/payments`)
        .set('Authorization', `Bearer ${outsider.token}`)
        .send({ amount: 50 })
        .expect(403);
    });

    it('refuses a payment from a Parent (write reserved to the Teacher)', async () => {
      await api()
        .post(`/api/v1/enrollments/${enrollmentId}/accounting/payments`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ amount: 50 })
        .expect(403);
    });

    it('ERR-CPT-001 : rejects a zero or negative payment amount', async () => {
      await api()
        .post(`/api/v1/enrollments/${enrollmentId}/accounting/payments`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ amount: 0 })
        .expect(400);
      await api()
        .post(`/api/v1/enrollments/${enrollmentId}/accounting/payments`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ amount: -10 })
        .expect(400);
    });

    it('records a payment -> PAYMENT/CREDIT entry, sequential entryNumber, account becomes ACTIVE', async () => {
      const res = await api()
        .post(`/api/v1/enrollments/${enrollmentId}/accounting/payments`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ amount: 100, paymentMethod: 'Espèces' })
        .expect(201);
      expect(res.body.type).toBe('PAYMENT');
      expect(res.body.direction).toBe('CREDIT');
      expect(res.body.status).toBe('POSTED');
      expect(res.body.amount).toBe(100);
      expect(res.body.entryNumber).toMatch(ENTRY_NUMBER_RE);

      const body = await getAccount(teacher.token, enrollmentId);
      expect(body.account.status).toBe('ACTIVE');
      expect(body.indicators.currentBalance).toBe(100);
      expect(body.indicators.paidAmount).toBe(100);
      expect(body.indicators.paymentCount).toBe(1);

      // NOT-CPT-001
      const activity = await prisma.activity.findFirst({
        where: { userId: parent1.id, type: 'CPT_PAYMENT_RECORDED' },
        orderBy: { createdAt: 'desc' },
      });
      expect(activity).not.toBeNull();
    });

    it('PERM-CPT-002 : corrects the payment via reversal + new entry, never modifies in place', async () => {
      const detail = await getAccount(teacher.token, enrollmentId);
      const original = detail.entries.find((e: any) => e.type === 'PAYMENT' && e.status === 'POSTED');
      expect(original).toBeDefined();

      const res = await api()
        .patch(`/api/v1/enrollments/${enrollmentId}/accounting/payments/${original.id}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ amount: 80, reasonNote: 'Erreur de saisie initiale' })
        .expect(200);
      expect(res.body.amount).toBe(80);
      expect(res.body.entryNumber).not.toBe(original.entryNumber);

      const after = await getAccount(teacher.token, enrollmentId);
      expect(after.indicators.currentBalance).toBe(80);
      const reversedOriginal = after.entries.find((e: any) => e.id === original.id);
      expect(reversedOriginal.status).toBe('REVERSED');
      const reversal = after.entries.find((e: any) => e.reversesEntryId === original.id);
      expect(reversal.direction).toBe('DEBIT');
      expect(reversal.amount).toBe(100);

      // RM-CPT-028 : l'écriture d'origine n'a jamais été supprimée, seulement marquée REVERSED.
      expect(after.entries.some((e: any) => e.id === original.id)).toBe(true);
    });

    it('ERR-CPT-003/008 : refuses to correct or cancel an already-reversed entry', async () => {
      const detail = await getAccount(teacher.token, enrollmentId);
      const reversedOriginal = detail.entries.find((e: any) => e.status === 'REVERSED' && e.type === 'PAYMENT');
      expect(reversedOriginal).toBeDefined();

      await api()
        .patch(`/api/v1/enrollments/${enrollmentId}/accounting/payments/${reversedOriginal.id}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ amount: 50, reasonNote: 'tentative invalide' })
        .expect(400);
      await api()
        .post(`/api/v1/enrollments/${enrollmentId}/accounting/payments/${reversedOriginal.id}/cancel`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(400);
    });

    it('RM-CPT-029 : cancels a payment via a reversal entry (balance decreases, nothing deleted)', async () => {
      const detail = await getAccount(teacher.token, enrollmentId);
      const correctedEntry = detail.entries.find((e: any) => e.type === 'PAYMENT' && e.status === 'POSTED');
      const balanceBefore = detail.indicators.currentBalance;

      const res = await api()
        .post(`/api/v1/enrollments/${enrollmentId}/accounting/payments/${correctedEntry.id}/cancel`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(201);
      expect(res.body.direction).toBe('DEBIT');
      expect(res.body.amount).toBe(correctedEntry.amount);

      const after = await getAccount(teacher.token, enrollmentId);
      expect(after.indicators.currentBalance).toBe(balanceBefore - correctedEntry.amount);
      // Deux écritures PAYMENT ont été annulées dans cette suite : l'originale (via la correction
      // précédente) et celle-ci (via cette annulation).
      expect(after.indicators.cancelledPaymentCount).toBe(2);
    });

    it('ERR-CPT-009 : refuses a payment on a non-active enrollment', async () => {
      await api()
        .post(`/api/v1/groups/${groupId}/enrollments/${enrollmentId}/suspend`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(201);
      await api()
        .post(`/api/v1/enrollments/${enrollmentId}/accounting/payments`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ amount: 20 })
        .expect(400);
      await api()
        .post(`/api/v1/groups/${groupId}/enrollments/${enrollmentId}/reactivate`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(201);
    });
  });

  describe('facturation automatique des séances (RM-CPT-009/040)', () => {
    let groupId: string;
    let studentId: string;
    let enrollmentId: string;
    let sessionId: string;

    beforeAll(async () => {
      const group = await createOpenGroup(teacher.token, `E2E-CPT-${runId} Groupe Facturation`, { publicPrice: 40 });
      groupId = group.id;
      const s = await createStudent(parent1.token, `S-Bill-${runId}`);
      studentId = s.id;
      enrollmentId = await enrollAndAccept(parent1.token, teacher.token, studentId, groupId);
      const session = await createSession(teacher.token, groupId, today);
      sessionId = session.id;
    });

    it('generates exactly one SESSION/DEBIT entry once attendance is validated', async () => {
      await validateSession(teacher.token, sessionId, studentId, 'PRESENT');

      const body = await getAccount(teacher.token, enrollmentId);
      const sessionEntries = body.entries.filter((e: any) => e.type === 'SESSION');
      expect(sessionEntries).toHaveLength(1);
      expect(sessionEntries[0].direction).toBe('DEBIT');
      expect(sessionEntries[0].amount).toBe(40);
      expect(sessionEntries[0].sessionId).toBe(sessionId);
      expect(body.indicators.currentBalance).toBe(-40);
      expect(body.indicators.invoicedAmount).toBe(40);
      expect(body.indicators.billedSessionCount).toBe(1);
    });

    it('PERM-CPT-006 : allows a Teacher adjustment within the 48h window (discount)', async () => {
      const res = await api()
        .post(`/api/v1/enrollments/${enrollmentId}/accounting/adjustments`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({
          sessionId,
          direction: 'CREDIT',
          amount: 10,
          reason: 'EXCEPTIONAL_DISCOUNT',
          reasonNote: 'Remise commerciale ponctuelle',
        })
        .expect(201);
      expect(res.body.type).toBe('ADJUSTMENT');

      const body = await getAccount(teacher.token, enrollmentId);
      expect(body.indicators.currentBalance).toBe(-30); // -40 + 10
      expect(body.indicators.totalDiscountsGranted).toBe(10);
      expect(body.indicators.adjustmentCount).toBe(1);
    });

    it('ERR-CPT-010 : rejects an adjustment without a justification', async () => {
      await api()
        .post(`/api/v1/enrollments/${enrollmentId}/accounting/adjustments`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ sessionId, direction: 'DEBIT', amount: 5, reason: 'DATA_ENTRY_ERROR' })
        .expect(400);
    });

    it('ERR-CPT-004 : refuses a Teacher adjustment past the 48h window; ADMIN_ADJUSTMENT still works', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-CPT-${runId} Groupe Hors Delai`, { publicPrice: 40 });
      const s = await createStudent(parent2.token, `S-Late-${runId}`);
      const lateEnrollmentId = await enrollAndAccept(parent2.token, teacher.token, s.id, group.id);
      const pastSession = await createSession(teacher.token, group.id, addDays(today, -5));
      await validateSession(teacher.token, pastSession.id, s.id, 'PRESENT');

      await api()
        .post(`/api/v1/enrollments/${lateEnrollmentId}/accounting/adjustments`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({
          sessionId: pastSession.id,
          direction: 'CREDIT',
          amount: 5,
          reason: 'DATA_ENTRY_ERROR',
          reasonNote: 'Correction tardive',
        })
        .expect(400);

      // Un Professeur sans la permission CPT_ADMIN_ADJUST ne peut pas emprunter la voie administrative.
      await api()
        .post(`/api/v1/admin/accounting/enrollments/${lateEnrollmentId}/admin-adjustments`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ direction: 'CREDIT', amount: 5, reason: 'ADMIN_CORRECTION', reasonNote: 'Correction admin' })
        .expect(403);

      const res = await api()
        .post(`/api/v1/admin/accounting/enrollments/${lateEnrollmentId}/admin-adjustments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          sessionId: pastSession.id,
          direction: 'CREDIT',
          amount: 5,
          reason: 'ADMIN_CORRECTION',
          reasonNote: 'Correction administrative hors délai',
        })
        .expect(201);
      expect(res.body.type).toBe('ADMIN_ADJUSTMENT');

      const body = await getAccount(teacher.token, lateEnrollmentId);
      expect(body.indicators.currentBalance).toBe(-35); // -40 + 5
    });
  });

  describe('alerte de solde débiteur (RM-CPT-022, franchissement de seuil)', () => {
    it('NOT-CPT-003 fires once, exactly when the balance crosses the debt threshold', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-CPT-${runId} Groupe Alerte`, {
        publicPrice: 40,
        debtAlertThresholdSessions: 2, // seuil = 80 TND
      });
      const s = await createStudent(parent1.token, `S-Alert-${runId}`);
      const enrollmentId = await enrollAndAccept(parent1.token, teacher.token, s.id, group.id);

      const session1 = await createSession(teacher.token, group.id, addDays(today, -2));
      await validateSession(teacher.token, session1.id, s.id, 'PRESENT'); // balance -40, en dessous du seuil

      let alerts = await prisma.activity.count({ where: { userId: parent1.id, type: 'CPT_DEBT_ALERT' } });
      expect(alerts).toBe(0);

      const session2 = await createSession(teacher.token, group.id, addDays(today, -1));
      await validateSession(teacher.token, session2.id, s.id, 'PRESENT'); // balance -80, franchit le seuil

      alerts = await prisma.activity.count({ where: { userId: parent1.id, type: 'CPT_DEBT_ALERT' } });
      expect(alerts).toBe(1);
      const teacherAlerts = await prisma.activity.count({ where: { userId: teacher.id, type: 'CPT_DEBT_ALERT' } });
      expect(teacherAlerts).toBe(1);

      const session3 = await createSession(teacher.token, group.id, today);
      await validateSession(teacher.token, session3.id, s.id, 'PRESENT'); // balance -120, toujours débiteur : pas de nouvelle alerte

      alerts = await prisma.activity.count({ where: { userId: parent1.id, type: 'CPT_DEBT_ALERT' } });
      expect(alerts).toBe(1);

      // Rappel de paiement manuel (NOT-CPT-007) : possible tant que le compte est débiteur.
      const reminderRes = await api()
        .post(`/api/v1/enrollments/${enrollmentId}/accounting/reminder`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(201);
      expect(reminderRes.body.sent).toBe(true);

      const remindersActivity = await prisma.activity.count({
        where: { userId: parent1.id, type: 'CPT_PAYMENT_REMINDER' },
      });
      expect(remindersActivity).toBe(1);

      // Une fois le compte régularisé (paiement), plus rien à rappeler.
      await api()
        .post(`/api/v1/enrollments/${enrollmentId}/accounting/payments`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ amount: 200 })
        .expect(201);
      await api()
        .post(`/api/v1/enrollments/${enrollmentId}/accounting/reminder`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(400);
    });

    /**
     * Régression : une écriture SESSION est toujours datée de la séance (`effectiveDate`), qui peut
     * être largement antérieure à "aujourd'hui" si le Professeur valide une séance en retard après
     * avoir déjà encaissé un paiement du jour. Le relevé chronologique (trié par `effectiveDate`)
     * place alors cette écriture SESSION AVANT le paiement, malgré un ordre de création inverse —
     * un bug initial comparait les deux DERNIÈRES lignes du relevé recalculé à chaque écriture, ce
     * qui déclenchait une fausse alerte en double dans ce cas précis (repéré via des données de
     * démonstration manuelles, pas par les tests automatisés existants).
     */
    it('does not double-fire a credit alert when a back-dated SESSION entry is posted after a same-day payment', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-CPT-${runId} Groupe Alerte Retro`, {
        publicPrice: 25,
        debtAlertThresholdSessions: 4, // seuil créditeur = 100 TND
      });
      const s = await createStudent(parent1.token, `S-Retro-${runId}`);
      const enrollmentId = await enrollAndAccept(parent1.token, teacher.token, s.id, group.id);

      // Paiement du jour : franchit le seuil créditeur (0 -> 200), une seule alerte attendue.
      await api()
        .post(`/api/v1/enrollments/${enrollmentId}/accounting/payments`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ amount: 200 })
        .expect(201);

      // Séance ANCIENNE validée après coup : son écriture SESSION est datée d'il y a 15 jours,
      // donc antérieure au paiement dans le relevé trié par date d'effet, bien que créée après lui.
      const oldSession = await createSession(teacher.token, group.id, addDays(today, -15));
      await validateSession(teacher.token, oldSession.id, s.id, 'PRESENT'); // balance 200 -> 175, toujours créditeur

      const body = await getAccount(teacher.token, enrollmentId);
      expect(body.indicators.currentBalance).toBe(175);

      // Compte scopé par refId : parent1 accumule des alertes sur d'autres comptes ailleurs dans
      // cette suite (les seuils y sont volontairement bas), un comptage global serait fragile.
      const creditAlerts = await prisma.activity.count({
        where: { userId: parent1.id, type: 'CPT_CREDIT_ALERT', refId: body.account.id },
      });
      expect(creditAlerts).toBe(1);
    });
  });

  describe('consultation Parent (RM-CPT-013)', () => {
    it('allows a Parent to read the account of their own child, but not another Parent’s child', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-CPT-${runId} Groupe Parent`, { publicPrice: 40 });
      const s = await createStudent(parent1.token, `S-Parent-${runId}`);
      const enrollmentId = await enrollAndAccept(parent1.token, teacher.token, s.id, group.id);
      await api()
        .post(`/api/v1/enrollments/${enrollmentId}/accounting/payments`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ amount: 30 })
        .expect(201);

      const own = await getAccount(parent1.token, enrollmentId);
      expect(own.indicators.currentBalance).toBe(30);

      await api()
        .get(`/api/v1/enrollments/${enrollmentId}/accounting`)
        .set('Authorization', `Bearer ${parent2.token}`)
        .expect(403);

      const summary = await api()
        .get(`/api/v1/parent/children/${s.id}/accounting`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      expect(summary.body).toHaveLength(1);
      expect(summary.body[0].currentBalance).toBe(30);
      expect(summary.body[0].group.name).toBe(group.name);

      // Un autre Parent n'a pas accès au résumé d'un enfant qui n'est pas le sien.
      await api()
        .get(`/api/v1/parent/children/${s.id}/accounting`)
        .set('Authorization', `Bearer ${parent2.token}`)
        .expect(403);
    });
  });

  describe('indicateurs agrégés (Ch.15.12.2/15.12.3)', () => {
    it('exposes numeric teacher-level and group-level indicators', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-CPT-${runId} Groupe Indicateurs`, { publicPrice: 40 });
      const s = await createStudent(parent1.token, `S-Ind-${runId}`);
      await enrollAndAccept(parent1.token, teacher.token, s.id, group.id);

      const teacherRes = await api()
        .get('/api/v1/teacher/accounting/indicators')
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(200);
      expect(typeof teacherRes.body.debtorAccountCount).toBe('number');
      expect(typeof teacherRes.body.realizedRevenue).toBe('number');
      expect(typeof teacherRes.body.forecastRevenue).toBe('number');

      const groupRes = await api()
        .get(`/api/v1/groups/${group.id}/accounting/indicators`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(200);
      expect(typeof groupRes.body.totalInvoiced).toBe('number');
      expect(typeof groupRes.body.debtorAccountCount).toBe('number');

      await api()
        .get(`/api/v1/groups/${group.id}/accounting/indicators`)
        .set('Authorization', `Bearer ${outsider.token}`)
        .expect(403);
    });
  });

  describe('compte verrouillé (RM-CPT-020)', () => {
    it('blocks Teacher writes on a LOCKED account, but ADMIN_ADJUSTMENT still works', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-CPT-${runId} Groupe Verrou`, { publicPrice: 40 });
      const s = await createStudent(parent1.token, `S-Locked-${runId}`);
      const enrollmentId = await enrollAndAccept(parent1.token, teacher.token, s.id, group.id);

      // Simule directement le verrouillage (fin de période comptable, RM-CPT-020) sans toucher à la
      // période partagée par les autres suites e2e — seul ce compte, propre à ce test, est concerné.
      await prisma.accountingAccount.update({
        where: { enrollmentId },
        data: { status: 'LOCKED', lockedAt: new Date() },
      });

      const before = await getAccount(teacher.token, enrollmentId);
      expect(before.account.status).toBe('LOCKED');

      await api()
        .post(`/api/v1/enrollments/${enrollmentId}/accounting/payments`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ amount: 20 })
        .expect(400);

      const res = await api()
        .post(`/api/v1/admin/accounting/enrollments/${enrollmentId}/admin-adjustments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ direction: 'CREDIT', amount: 15, reason: 'ADMIN_CORRECTION', reasonNote: 'Ajustement sur compte verrouillé' })
        .expect(201);
      expect(res.body.type).toBe('ADMIN_ADJUSTMENT');

      const after = await getAccount(teacher.token, enrollmentId);
      expect(after.indicators.currentBalance).toBe(15);
    });
  });
});
