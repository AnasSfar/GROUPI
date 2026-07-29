import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * E2E tests for the subscriptions module (Ch.21 — Gestion des abonnements Professeur), run against
 * the real `groupi_test` Postgres database — same shape as group-change.e2e-spec.ts /
 * notifications.e2e-spec.ts. All accounts use the `e2e-abo-` email prefix. Uses isolated
 * AcademicYear fixtures (far future dates) rather than the seeded 2026-2027 year, so capacity/
 * uniqueness checks never collide with other suites or the seed data.
 */
describe('Subscriptions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const runId = Date.now();
  const api = () => request(app.getHttpServer());
  const password = 'CorrectHorse123';
  const now = new Date();

  interface Actor {
    id: string;
    email: string;
    token: string;
  }

  async function registerAndActivate(role: 'TEACHER' | 'PARENT', label: string): Promise<Actor> {
    const email = `e2e-abo-${role.toLowerCase()}-${label}-${runId}@example.com`;
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
      })
      .expect(201);
    const userId = res.body.id as string;

    await prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
    if (role === 'TEACHER') {
      await prisma.teacherProfile.update({ where: { id: userId }, data: { status: 'VALIDATED' } });
    } else {
      await prisma.parentProfile.update({ where: { id: userId }, data: { validatedAt: new Date() } });
    }

    const loginRes = await api().post('/api/v1/auth/login').send({ email, password }).expect(200);
    return { id: userId, email, token: loginRes.body.accessToken as string };
  }

  /** Poll (`emailSentAt` est renseigné de façon asynchrone, hors chemin critique). */
  async function waitForActivity(predicate: (a: any) => boolean, token: string, timeoutMs = 3000): Promise<any> {
    const start = Date.now();
    for (;;) {
      const res = await api().get('/api/v1/notifications/me').set('Authorization', `Bearer ${token}`).expect(200);
      const found = res.body.find(predicate);
      if (found && (found.emailSentAt || Date.now() - start > timeoutMs)) {
        return found;
      }
      if (Date.now() - start > timeoutMs) {
        return found ?? null;
      }
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  let superAdminToken: string;
  let discoveryPlanId: string;
  let intermediatePlanId: string;
  let proPlanId: string;
  let yearAId: string; // année ouverte principale
  let yearBId: string; // seconde année ouverte, isolée (pour tester le rejeu de la Découverte)
  let closedYearId: string;

  let teacherPaid: Actor;
  let teacherTrial: Actor;
  let teacherClosedYear: Actor;
  let teacherGuard: Actor;
  let parent1: Actor;
  let subjectId: string;
  let schoolLevelId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    const superAdminEmail = `e2e-abo-superadmin-${runId}@example.com`;
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await prisma.user.create({
      data: { email: superAdminEmail, passwordHash, status: 'ACTIVE', roles: ['SUPER_ADMIN'] },
    });
    const superAdminLogin = await api()
      .post('/api/v1/auth/login')
      .send({ email: superAdminEmail, password })
      .expect(200);
    superAdminToken = superAdminLogin.body.accessToken as string;

    const discovery = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { code: 'DECOUVERTE' } });
    discoveryPlanId = discovery.id;
    const intermediate = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { code: 'INTERMEDIAIRE' } });
    intermediatePlanId = intermediate.id;
    const pro = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { code: 'PRO' } });
    proPlanId = pro.id;

    const yearA = await prisma.academicYear.create({
      data: {
        label: `E2E-ABO-A-${runId}`,
        startDate: new Date(now.getTime() + 400 * 86400_000),
        endDate: new Date(now.getTime() + 700 * 86400_000),
        status: 'OPEN',
      },
    });
    yearAId = yearA.id;

    const yearB = await prisma.academicYear.create({
      data: {
        label: `E2E-ABO-B-${runId}`,
        startDate: new Date(now.getTime() + 750 * 86400_000),
        endDate: new Date(now.getTime() + 1000 * 86400_000),
        status: 'OPEN',
      },
    });
    yearBId = yearB.id;

    const closedYear = await prisma.academicYear.create({
      data: {
        label: `E2E-ABO-CLOSED-${runId}`,
        startDate: new Date(now.getTime() - 700 * 86400_000),
        endDate: new Date(now.getTime() - 400 * 86400_000),
        status: 'CLOSED',
      },
    });
    closedYearId = closedYear.id;

    const subjectLevel = await prisma.subjectLevel.findFirst({ where: { isAllowed: true, isActive: true } });
    if (!subjectLevel) throw new Error('Aucune combinaison matière/niveau — lancez `npx prisma db seed`.');
    subjectId = subjectLevel.subjectId;
    schoolLevelId = subjectLevel.schoolLevelId;

    teacherPaid = await registerAndActivate('TEACHER', `paid-${runId}`);
    teacherTrial = await registerAndActivate('TEACHER', `trial-${runId}`);
    teacherClosedYear = await registerAndActivate('TEACHER', `closed-${runId}`);
    teacherGuard = await registerAndActivate('TEACHER', `guard-${runId}`);
    parent1 = await registerAndActivate('PARENT', `p1-${runId}`);
  });

  afterAll(async () => {
    const teacherIds = [teacherPaid.id, teacherTrial.id, teacherClosedYear.id, teacherGuard.id];
    const parentIds = [parent1.id];
    const userIds = [...teacherIds, ...parentIds];

    const guardGroups = await prisma.group.findMany({ where: { teacherId: teacherGuard.id }, select: { id: true } });
    await prisma.groupSchedule.deleteMany({ where: { groupId: { in: guardGroups.map((g) => g.id) } } });
    await prisma.group.deleteMany({ where: { teacherId: teacherGuard.id } });
    await prisma.subscription.deleteMany({ where: { teacherId: { in: teacherIds } } });
    await prisma.activity.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.loginHistory.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userSession.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.passwordResetToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.emailVerificationToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.teacherSubject.deleteMany({ where: { teacherProfileId: { in: teacherIds } } });
    await prisma.teacherSchoolLevel.deleteMany({ where: { teacherProfileId: { in: teacherIds } } });
    await prisma.teacherProfile.deleteMany({ where: { id: { in: teacherIds } } });
    await prisma.parentProfile.deleteMany({ where: { id: { in: parentIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });

    const superAdmin = await prisma.user.findUnique({ where: { email: `e2e-abo-superadmin-${runId}@example.com` } });
    if (superAdmin) {
      await prisma.userSession.deleteMany({ where: { userId: superAdmin.id } });
      await prisma.loginHistory.deleteMany({ where: { userId: superAdmin.id } });
      await prisma.user.delete({ where: { id: superAdmin.id } });
    }

    await prisma.academicYear.deleteMany({ where: { id: { in: [yearAId, yearBId, closedYearId] } } });

    await app.close();
  });

  describe('catalogue des offres', () => {
    it('lists the 3 seeded plans with their commercial attributes (Ch.4.3)', async () => {
      const res = await api()
        .get('/api/v1/subscriptions/plans')
        .set('Authorization', `Bearer ${teacherPaid.token}`)
        .expect(200);
      const discovery = res.body.find((p: any) => p.code === 'DECOUVERTE');
      const intermediate = res.body.find((p: any) => p.code === 'INTERMEDIAIRE');
      const pro = res.body.find((p: any) => p.code === 'PRO');
      expect(discovery).toMatchObject({ price: 0, maxActiveEnrollments: 20, durationDays: 30, isTrial: true });
      expect(intermediate).toMatchObject({ price: 49, maxActiveEnrollments: 50, durationDays: null, isTrial: false });
      expect(pro).toMatchObject({ price: 99, maxActiveEnrollments: null, durationDays: null, isTrial: false });
    });
  });

  describe('souscription — offre payante', () => {
    let subscriptionId: string;

    it('rejects subscription creation from a non-teacher role -> 403', async () => {
      await api()
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ planId: intermediatePlanId, academicYearId: yearAId })
        .expect(403);
    });

    it('creates a PENDING_PAYMENT subscription for a paid plan (Ch.21.6/4.7)', async () => {
      const res = await api()
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${teacherPaid.token}`)
        .send({ planId: intermediatePlanId, academicYearId: yearAId })
        .expect(201);
      expect(res.body.status).toBe('PENDING_PAYMENT');
      expect(res.body.activatedAt).toBeNull();
      expect(res.body.plan.code).toBe('INTERMEDIAIRE');
      subscriptionId = res.body.id;
    });

    it('rejects a second subscription for the same academic year (ERR-ABO-005/RM-ABO-005)', async () => {
      await api()
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${teacherPaid.token}`)
        .send({ planId: proPlanId, academicYearId: yearAId })
        .expect(400);
    });

    it('rejects payment validation from a non-admin -> 403', async () => {
      await api()
        .post(`/api/v1/admin/subscriptions/${subscriptionId}/validate-payment`)
        .set('Authorization', `Bearer ${teacherPaid.token}`)
        .expect(403);
    });

    it('validates the payment as Super Admin, activating the subscription (PERM-ABO-005)', async () => {
      const res = await api()
        .post(`/api/v1/admin/subscriptions/${subscriptionId}/validate-payment`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(201);
      expect(res.body.status).toBe('ACTIVE');
      expect(res.body.activatedAt).not.toBeNull();
      expect(res.body.paidAt).not.toBeNull();
      expect(new Date(res.body.expiresAt).getTime()).toBe(new Date(res.body.academicYear.endDate).getTime());

      const mine = await api()
        .get('/api/v1/subscriptions/mine')
        .set('Authorization', `Bearer ${teacherPaid.token}`)
        .expect(200);
      expect(mine.body.find((s: any) => s.id === subscriptionId).status).toBe('ACTIVE');
    });

    it('rejects re-validating an already-active subscription', async () => {
      await api()
        .post(`/api/v1/admin/subscriptions/${subscriptionId}/validate-payment`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(400);
    });

    it('rejects reactivating a subscription that is not suspended (ERR-ABO-004)', async () => {
      await api()
        .post(`/api/v1/admin/subscriptions/${subscriptionId}/reactivate`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(400);
    });

    it('suspends the active subscription, notifying the teacher (NOT-ABO-006, Critique -> e-mail)', async () => {
      const res = await api()
        .post(`/api/v1/admin/subscriptions/${subscriptionId}/suspend`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ reason: 'Impayé' })
        .expect(201);
      expect(res.body.status).toBe('SUSPENDED');
      expect(res.body.suspensionReason).toBe('Impayé');

      const found = await waitForActivity(
        (a: any) => a.type === 'SUBSCRIPTION_SUSPENDED' && a.refId === subscriptionId,
        teacherPaid.token,
      );
      expect(found).toBeDefined();
      expect(found.priority).toBe('CRITICAL');
      expect(found.emailSentAt).not.toBeNull();
    });

    it('rejects suspending a subscription that is not active', async () => {
      await api()
        .post(`/api/v1/admin/subscriptions/${subscriptionId}/suspend`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({})
        .expect(400);
    });

    it('reactivates the suspended subscription, notifying the teacher (NOT-ABO-007, Important -> e-mail)', async () => {
      const res = await api()
        .post(`/api/v1/admin/subscriptions/${subscriptionId}/reactivate`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(201);
      expect(res.body.status).toBe('ACTIVE');
      expect(res.body.suspendedAt).toBeNull();
      expect(res.body.suspensionReason).toBeNull();

      const found = await waitForActivity(
        (a: any) => a.type === 'SUBSCRIPTION_REACTIVATED' && a.refId === subscriptionId,
        teacherPaid.token,
      );
      expect(found).toBeDefined();
      expect(found.priority).toBe('IMPORTANT');
      expect(found.emailSentAt).not.toBeNull();
    });

    it('expires lazily once past its end date (RM-ABO-002/RM-SUB-024)', async () => {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { expiresAt: new Date(now.getTime() - 86400_000) },
      });

      const mine = await api()
        .get('/api/v1/subscriptions/mine')
        .set('Authorization', `Bearer ${teacherPaid.token}`)
        .expect(200);
      expect(mine.body.find((s: any) => s.id === subscriptionId).status).toBe('EXPIRED');
    });
  });

  describe('souscription — offre gratuite Découverte', () => {
    it('auto-activates immediately, no payment step (Ch.21.2/4.3)', async () => {
      const res = await api()
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${teacherTrial.token}`)
        .send({ planId: discoveryPlanId, academicYearId: yearAId })
        .expect(201);
      expect(res.body.status).toBe('ACTIVE');
      expect(res.body.activatedAt).not.toBeNull();

      const expected = new Date(now.getTime() + 30 * 86400_000);
      expect(Math.abs(new Date(res.body.expiresAt).getTime() - expected.getTime())).toBeLessThan(5 * 60_000);
    });

    it('rejects a second Découverte subscription for the same teacher, even for another year (ERR-SUB-004/RM-SUB-005)', async () => {
      await api()
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${teacherTrial.token}`)
        .send({ planId: discoveryPlanId, academicYearId: yearBId })
        .expect(400);
    });
  });

  describe('année académique clôturée', () => {
    it('rejects a subscription for a closed academic year (ERR-ABO-003)', async () => {
      await api()
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${teacherClosedYear.token}`)
        .send({ planId: intermediatePlanId, academicYearId: closedYearId })
        .expect(400);
    });
  });

  describe('Ch.22 — feature-gating (SubscriptionGuard)', () => {
    let guardSubscriptionId: string;

    let groupAttemptCounter = 0;

    function createGroupAttempt() {
      groupAttemptCounter += 1;
      return api()
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${teacherGuard.token}`)
        .send({
          name: `E2E-ABO-GUARD-${runId}-${groupAttemptCounter}`,
          subjectId,
          schoolLevelId,
          academicYearId: yearAId,
          capacity: 10,
          publicPrice: 30,
          teachingMode: 'PRESENTIAL',
          absenceBillingPolicy: 'ALL_BILLED',
          visibilityWhenFull: 'VISIBLE',
          startDate: new Date(now.getTime() + 400 * 86400_000).toISOString().slice(0, 10),
          schedules: [{ dayOfWeek: 'MONDAY', startTime: '18:00', durationMinutes: 60 }],
        });
    }

    it('always allows consultation (GET), even with no subscription at all (Ch.22.7)', async () => {
      await api().get('/api/v1/groups/mine').set('Authorization', `Bearer ${teacherGuard.token}`).expect(200);
    });

    it('rejects group creation with no subscription for any OPEN academic year (ERR-PERM-001)', async () => {
      const res = await createGroupAttempt();
      expect(res.status).toBe(403);
    });

    it('still rejects while the subscription is PENDING_PAYMENT', async () => {
      const sub = await api()
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${teacherGuard.token}`)
        .send({ planId: intermediatePlanId, academicYearId: yearAId })
        .expect(201);
      guardSubscriptionId = sub.body.id;

      const res = await createGroupAttempt();
      expect(res.status).toBe(403);
    });

    it('allows creation once the payment is validated (ACTIVE)', async () => {
      await api()
        .post(`/api/v1/admin/subscriptions/${guardSubscriptionId}/validate-payment`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(201);

      const res = await createGroupAttempt();
      expect(res.status).toBe(201);
    });

    it('rejects creation once the subscription is suspended (ERR-PERM-003)', async () => {
      await api()
        .post(`/api/v1/admin/subscriptions/${guardSubscriptionId}/suspend`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({})
        .expect(201);

      const res = await createGroupAttempt();
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('ERR-PERM-003');
    });

    it('allows creation again once reactivated', async () => {
      await api()
        .post(`/api/v1/admin/subscriptions/${guardSubscriptionId}/reactivate`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(201);

      const res = await createGroupAttempt();
      expect(res.status).toBe(201);
    });

    it('still allows modification within the 7-day grace period after expiry (ERR-PERM-006/RM-PERM-008)', async () => {
      await prisma.subscription.update({
        where: { id: guardSubscriptionId },
        data: { status: 'EXPIRED', expiresAt: new Date(now.getTime() - 3 * 86400_000) },
      });

      const res = await createGroupAttempt();
      expect(res.status).toBe(201);
    });

    it('rejects modification once the grace period is over (RM-SUB-020)', async () => {
      await prisma.subscription.update({
        where: { id: guardSubscriptionId },
        data: { status: 'EXPIRED', expiresAt: new Date(now.getTime() - 8 * 86400_000) },
      });

      const res = await createGroupAttempt();
      expect(res.status).toBe(403);
    });
  });
});
