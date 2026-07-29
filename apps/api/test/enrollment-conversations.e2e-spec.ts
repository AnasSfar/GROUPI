import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { grantActiveSubscription } from './helpers/grant-subscription';

/**
 * E2E tests for the enrollment-conversations module (Ch.19.3 — Fil de commentaires de
 * l'inscription), run against the real `groupi_test` Postgres database — same shape as
 * group-change.e2e-spec.ts. All accounts use the `e2e-com-` email prefix.
 */
describe('Enrollment conversations (e2e)', () => {
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
    const email = `e2e-com-${role.toLowerCase()}-${label}-${runId}@example.com`;
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
      // Ch.22 : SubscriptionGuard exige un abonnement exploitable pour créer/modifier.
      await grantActiveSubscription(prisma, userId, academicYearId);
    } else {
      await prisma.parentProfile.update({ where: { id: userId }, data: { validatedAt: new Date() } });
    }

    const loginRes = await api().post('/api/v1/auth/login').send({ email, password }).expect(200);
    return { id: userId, email, token: loginRes.body.accessToken as string };
  }

  async function createOpenGroup(teacherToken: string, name: string): Promise<any> {
    const res = await api()
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name,
        subjectId,
        schoolLevelId,
        academicYearId,
        capacity: 10,
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

  let teacher: Actor;
  let outsiderTeacher: Actor;
  let parent1: Actor;
  let outsiderParent: Actor;

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

    teacher = await registerAndActivate('TEACHER', `t-${runId}`);
    outsiderTeacher = await registerAndActivate('TEACHER', `to-${runId}`);
    parent1 = await registerAndActivate('PARENT', `p1-${runId}`);
    outsiderParent = await registerAndActivate('PARENT', `po-${runId}`);
  });

  afterAll(async () => {
    const teacherIds = [teacher.id, outsiderTeacher.id];
    const parentIds = [parent1.id, outsiderParent.id];
    const userIds = [...teacherIds, ...parentIds];

    const groups = await prisma.group.findMany({ where: { teacherId: { in: teacherIds } }, select: { id: true } });
    const groupIds = groups.map((g) => g.id);
    const students = await prisma.student.findMany({ where: { parentId: { in: parentIds } }, select: { id: true } });
    const studentIds = students.map((s) => s.id);
    const enrollments = await prisma.enrollment.findMany({
      where: { OR: [{ groupId: { in: groupIds } }, { studentId: { in: studentIds } }] },
      select: { id: true },
    });
    const enrollmentIds = enrollments.map((e) => e.id);

    await prisma.activity.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.enrollmentComment.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
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

  describe('confidentialité (ERR-COM-001/006)', () => {
    it('refuses access to a third-party teacher and a third-party parent', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-COM-${runId} Groupe Confidentialité`);
      const student = await createStudent(parent1.token, `S-Conf-${runId}`);
      const enrollmentId = await enrollAndAccept(parent1.token, teacher.token, student.id, group.id);

      await api()
        .get(`/api/v1/enrollments/${enrollmentId}/comments`)
        .set('Authorization', `Bearer ${outsiderTeacher.token}`)
        .expect(403);
      await api()
        .get(`/api/v1/enrollments/${enrollmentId}/comments`)
        .set('Authorization', `Bearer ${outsiderParent.token}`)
        .expect(403);
      await api()
        .post(`/api/v1/enrollments/${enrollmentId}/comments`)
        .set('Authorization', `Bearer ${outsiderParent.token}`)
        .send({ body: 'Intrusion' })
        .expect(403);
    });
  });

  describe('création (ERR-COM-002) et notifications croisées (NOT-COM-001/002)', () => {
    it('rejects a new comment on a request still pending validation', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-COM-${runId} Groupe Pending`);
      const student = await createStudent(parent1.token, `S-Pending-${runId}`);
      const reqRes = await api()
        .post('/api/v1/enrollments')
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ studentId: student.id, groupId: group.id })
        .expect(201);

      await api()
        .post(`/api/v1/enrollments/${reqRes.body.id}/comments`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ body: 'Trop tôt' })
        .expect(400);
    });

    it('lets the teacher and parent exchange comments and notifies the other party each time', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-COM-${runId} Groupe Échange`);
      const student = await createStudent(parent1.token, `S-Exchange-${runId}`);
      const enrollmentId = await enrollAndAccept(parent1.token, teacher.token, student.id, group.id);

      const teacherComment = await api()
        .post(`/api/v1/enrollments/${enrollmentId}/comments`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ body: 'Bons progrès cette semaine.' })
        .expect(201);
      expect(teacherComment.body.authorRole).toBe('TEACHER');

      const parentNotifs = await api()
        .get('/api/v1/notifications/me')
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      expect(
        parentNotifs.body.find((a: any) => a.type === 'COM_COMMENT_CREATED' && a.refId === enrollmentId),
      ).toBeDefined();

      const parentReply = await api()
        .post(`/api/v1/enrollments/${enrollmentId}/comments`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ body: 'Merci pour le retour !' })
        .expect(201);
      expect(parentReply.body.authorRole).toBe('PARENT');

      const teacherNotifs = await api()
        .get('/api/v1/notifications/me')
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(200);
      expect(
        teacherNotifs.body.find((a: any) => a.type === 'COM_COMMENT_REPLIED' && a.refId === enrollmentId),
      ).toBeDefined();

      const thread = await api()
        .get(`/api/v1/enrollments/${enrollmentId}/comments`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(200);
      expect(thread.body.length).toBe(2);
    });
  });

  describe('fenêtre de modification 48h et gel après réponse (ERR-COM-004)', () => {
    it('lets the author edit/delete within 48h, but freezes it after a reply from the other party', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-COM-${runId} Groupe Gel`);
      const student = await createStudent(parent1.token, `S-Freeze-${runId}`);
      const enrollmentId = await enrollAndAccept(parent1.token, teacher.token, student.id, group.id);

      const created = await api()
        .post(`/api/v1/enrollments/${enrollmentId}/comments`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ body: 'Premier message' })
        .expect(201);
      const commentId = created.body.id as string;

      const edited = await api()
        .patch(`/api/v1/enrollments/${enrollmentId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ body: 'Premier message corrigé' })
        .expect(200);
      expect(edited.body.body).toBe('Premier message corrigé');

      // Un autre auteur (le Parent) ne peut pas modifier/supprimer le commentaire du Professeur.
      await api()
        .patch(`/api/v1/enrollments/${enrollmentId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ body: 'Usurpation' })
        .expect(403);

      // La réponse du Parent fige immédiatement le commentaire du Professeur.
      await api()
        .post(`/api/v1/enrollments/${enrollmentId}/comments`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ body: 'Réponse du parent' })
        .expect(201);

      await api()
        .patch(`/api/v1/enrollments/${enrollmentId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ body: 'Trop tard' })
        .expect(400);
      await api()
        .delete(`/api/v1/enrollments/${enrollmentId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(400);
    });

    it('refuses edit/delete once the 48h window has elapsed, even without a reply', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-COM-${runId} Groupe 48h`);
      const student = await createStudent(parent1.token, `S-48h-${runId}`);
      const enrollmentId = await enrollAndAccept(parent1.token, teacher.token, student.id, group.id);

      const created = await api()
        .post(`/api/v1/enrollments/${enrollmentId}/comments`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ body: 'Message ancien' })
        .expect(201);
      const commentId = created.body.id as string;

      // Simule le passage du temps au-delà de la fenêtre de 48h (pas de job planifié dans ce projet).
      await prisma.enrollmentComment.update({
        where: { id: commentId },
        data: { createdAt: new Date(Date.now() - 49 * 3600 * 1000) },
      });

      await api()
        .patch(`/api/v1/enrollments/${enrollmentId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ body: 'Trop tard' })
        .expect(400);
    });
  });

  describe('lecture après clôture (RM-COM-005 vs ERR-COM-002)', () => {
    it('keeps the thread readable after the enrollment is archived, but rejects new comments', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-COM-${runId} Groupe Archive`);
      const student = await createStudent(parent1.token, `S-Archive-${runId}`);
      const enrollmentId = await enrollAndAccept(parent1.token, teacher.token, student.id, group.id);

      await api()
        .post(`/api/v1/enrollments/${enrollmentId}/comments`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ body: 'Avant clôture' })
        .expect(201);

      await prisma.enrollment.update({ where: { id: enrollmentId }, data: { status: 'ARCHIVED' } });

      const thread = await api()
        .get(`/api/v1/enrollments/${enrollmentId}/comments`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(200);
      expect(thread.body.length).toBe(1);

      await api()
        .post(`/api/v1/enrollments/${enrollmentId}/comments`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ body: 'Trop tard' })
        .expect(400);
    });
  });
});
