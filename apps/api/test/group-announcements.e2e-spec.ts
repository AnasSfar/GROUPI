import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { grantActiveSubscription } from './helpers/grant-subscription';

/**
 * E2E tests for the group-announcements module (Ch.19.4 — Annonces de groupe), run against the
 * real `groupi_test` Postgres database — same shape as group-change.e2e-spec.ts. All accounts use
 * the `e2e-ann-` email prefix.
 */
describe('Group announcements (e2e)', () => {
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
    const email = `e2e-ann-${role.toLowerCase()}-${label}-${runId}@example.com`;
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
  let parent2: Actor;
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
    parent2 = await registerAndActivate('PARENT', `p2-${runId}`);
    outsiderParent = await registerAndActivate('PARENT', `po-${runId}`);
  });

  afterAll(async () => {
    const teacherIds = [teacher.id, outsiderTeacher.id];
    const parentIds = [parent1.id, parent2.id, outsiderParent.id];
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
    const announcements = await prisma.groupAnnouncement.findMany({
      where: { groupId: { in: groupIds } },
      select: { id: true },
    });
    const announcementIds = announcements.map((a) => a.id);

    await prisma.activity.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.groupAnnouncementRead.deleteMany({ where: { announcementId: { in: announcementIds } } });
    await prisma.groupAnnouncement.deleteMany({ where: { id: { in: announcementIds } } });
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

  describe('création et autorisations', () => {
    it('refuses creation/update/deletion by a teacher who does not own the group', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-ANN-${runId} Groupe Ownership`);

      await api()
        .post(`/api/v1/groups/${group.id}/announcements`)
        .set('Authorization', `Bearer ${outsiderTeacher.token}`)
        .send({ title: 'Intrusion', body: 'Texte' })
        .expect(403);

      const created = await api()
        .post(`/api/v1/groups/${group.id}/announcements`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ title: 'Annonce', body: 'Texte' })
        .expect(201);

      await api()
        .patch(`/api/v1/groups/${group.id}/announcements/${created.body.id}`)
        .set('Authorization', `Bearer ${outsiderTeacher.token}`)
        .send({ title: 'Piraté' })
        .expect(403);
      await api()
        .delete(`/api/v1/groups/${group.id}/announcements/${created.body.id}`)
        .set('Authorization', `Bearer ${outsiderTeacher.token}`)
        .expect(403);
    });

    it('refuses creation on an archived group (ERR-COM-003)', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-ANN-${runId} Groupe Archivé`);
      await api().post(`/api/v1/groups/${group.id}/close`).set('Authorization', `Bearer ${teacher.token}`).expect(201);
      await api().post(`/api/v1/groups/${group.id}/archive`).set('Authorization', `Bearer ${teacher.token}`).expect(201);

      await api()
        .post(`/api/v1/groups/${group.id}/announcements`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ title: 'Trop tard', body: 'Texte' })
        .expect(400);
    });

    it('refuses a scheduled announcement without a publish date (ERR-COM-007)', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-ANN-${runId} Groupe Programmée`);
      await api()
        .post(`/api/v1/groups/${group.id}/announcements`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ title: 'Sans date', body: 'Texte', scheduled: true })
        .expect(400);
    });
  });

  describe('confidentialité (ERR-COM-001/006)', () => {
    it('refuses list/read access to a parent with no enrollment in the group', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-ANN-${runId} Groupe Confidentialité`);
      await api()
        .post(`/api/v1/groups/${group.id}/announcements`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ title: 'Annonce', body: 'Texte' })
        .expect(201);

      await api()
        .get(`/api/v1/groups/${group.id}/announcements`)
        .set('Authorization', `Bearer ${outsiderParent.token}`)
        .expect(403);
    });
  });

  describe('visibilité paresseuse (programmée/expirée)', () => {
    it('hides a scheduled announcement from parents but shows it as SCHEDULED to the teacher', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-ANN-${runId} Groupe Scheduled`);
      const student = await createStudent(parent1.token, `S-Sched-${runId}`);
      await enrollAndAccept(parent1.token, teacher.token, student.id, group.id);

      const future = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
      const created = await api()
        .post(`/api/v1/groups/${group.id}/announcements`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ title: 'Programmée', body: 'Texte', scheduled: true, publishAt: future })
        .expect(201);
      expect(created.body.effectiveStatus).toBe('SCHEDULED');

      const parentList = await api()
        .get(`/api/v1/groups/${group.id}/announcements`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      expect(parentList.body.find((a: any) => a.id === created.body.id)).toBeUndefined();

      const teacherList = await api()
        .get(`/api/v1/groups/${group.id}/announcements`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(200);
      const teacherView = teacherList.body.find((a: any) => a.id === created.body.id);
      expect(teacherView.effectiveStatus).toBe('SCHEDULED');

      // Aucune notification immédiate pour une annonce programmée (NOT-COM-006 différé, hors scope).
      const notifs = await api()
        .get('/api/v1/notifications/me')
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      expect(notifs.body.find((a: any) => a.refId === created.body.id)).toBeUndefined();
    });

    it('hides an expired announcement from parents but keeps it visible as EXPIRED to the teacher', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-ANN-${runId} Groupe Expired`);
      const student = await createStudent(parent1.token, `S-Exp-${runId}`);
      await enrollAndAccept(parent1.token, teacher.token, student.id, group.id);

      const created = await api()
        .post(`/api/v1/groups/${group.id}/announcements`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ title: 'Bientôt expirée', body: 'Texte' })
        .expect(201);

      // Simule le passage du temps au-delà de la date d'expiration (pas de job planifié dans ce projet).
      await prisma.groupAnnouncement.update({
        where: { id: created.body.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const parentList = await api()
        .get(`/api/v1/groups/${group.id}/announcements`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      expect(parentList.body.find((a: any) => a.id === created.body.id)).toBeUndefined();

      const teacherList = await api()
        .get(`/api/v1/groups/${group.id}/announcements`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(200);
      expect(teacherList.body.find((a: any) => a.id === created.body.id).effectiveStatus).toBe('EXPIRED');

      await api()
        .patch(`/api/v1/groups/${group.id}/announcements/${created.body.id}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ title: 'Trop tard' })
        .expect(400);
    });
  });

  describe('accusés de lecture (RM-COM-011) et verrouillage d’édition', () => {
    it('records only the first read per parent and reports accurate read counts to the teacher', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-ANN-${runId} Groupe Lecture`);
      const student1 = await createStudent(parent1.token, `S-Read1-${runId}`);
      const student2 = await createStudent(parent2.token, `S-Read2-${runId}`);
      await enrollAndAccept(parent1.token, teacher.token, student1.id, group.id);
      await enrollAndAccept(parent2.token, teacher.token, student2.id, group.id);

      const created = await api()
        .post(`/api/v1/groups/${group.id}/announcements`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ title: 'Annonce lue', body: 'Texte' })
        .expect(201);
      expect(created.body.totalParents).toBe(2);
      expect(created.body.readCount).toBe(0);

      // NOT-COM-003 : chaque parent actif est notifié de la nouvelle annonce.
      const parent1Notifs = await api()
        .get('/api/v1/notifications/me')
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      expect(parent1Notifs.body.find((a: any) => a.refId === created.body.id)).toBeDefined();

      const firstRead = await api()
        .post(`/api/v1/groups/${group.id}/announcements/${created.body.id}/read`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(201);
      const secondRead = await api()
        .post(`/api/v1/groups/${group.id}/announcements/${created.body.id}/read`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(201);
      // Seule la première lecture est enregistrée (RM-COM-011).
      expect(secondRead.body.readAt).toBe(firstRead.body.readAt);

      const teacherList = await api()
        .get(`/api/v1/groups/${group.id}/announcements`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(200);
      const view = teacherList.body.find((a: any) => a.id === created.body.id);
      expect(view.readCount).toBe(1);
      expect(view.unreadParents).toEqual([parent2.id]);

      // Tant que tous les Parents n'ont pas lu, la modification reste possible.
      await api()
        .patch(`/api/v1/groups/${group.id}/announcements/${created.body.id}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ title: 'Toujours modifiable' })
        .expect(200);

      await api()
        .post(`/api/v1/groups/${group.id}/announcements/${created.body.id}/read`)
        .set('Authorization', `Bearer ${parent2.token}`)
        .expect(201);

      // Lue par tous les Parents actifs : modification refusée (§19.4).
      await api()
        .patch(`/api/v1/groups/${group.id}/announcements/${created.body.id}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ title: 'Trop tard' })
        .expect(400);
    });

    it('refuses read receipts from a parent with no enrollment in the group', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-ANN-${runId} Groupe Lecture Refusée`);
      const created = await api()
        .post(`/api/v1/groups/${group.id}/announcements`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ title: 'Annonce', body: 'Texte' })
        .expect(201);

      await api()
        .post(`/api/v1/groups/${group.id}/announcements/${created.body.id}/read`)
        .set('Authorization', `Bearer ${outsiderParent.token}`)
        .expect(403);
    });
  });

  describe('suppression logique (RM-COM-014)', () => {
    it('soft-deletes an announcement, keeping it visible to the teacher but not created twice', async () => {
      const group = await createOpenGroup(teacher.token, `E2E-ANN-${runId} Groupe Suppression`);
      const created = await api()
        .post(`/api/v1/groups/${group.id}/announcements`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .send({ title: 'À supprimer', body: 'Texte' })
        .expect(201);

      await api()
        .delete(`/api/v1/groups/${group.id}/announcements/${created.body.id}`)
        .set('Authorization', `Bearer ${teacher.token}`)
        .expect(200);

      const deleted = await prisma.groupAnnouncement.findUniqueOrThrow({ where: { id: created.body.id } });
      expect(deleted.deletedAt).not.toBeNull();
    });
  });
});
