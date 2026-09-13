import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { grantActiveSubscription } from './helpers/grant-subscription';
import { createPendingEnrollmentDirect } from './helpers/create-enrollment';
import { registerParentDirect } from './helpers/register-parent-direct';

/**
 * E2E tests for Avenant 01, Chapitre D (Portail Parent cloisonné), run against the real
 * `groupi_test` Postgres database (see test/jest-e2e.setup.ts) :
 *  - RM-PAR-024/ERR-PAR-021 : préinscription restreinte aux Professeurs déjà rattachés/inscrits
 *    (`pre-enrollments.service.ts`), y compris la liste `GET /pre-enrollments/eligible-teachers`.
 *  - RM-PAR-025/ERR-PAR-022 : `GET /group-changes/eligible-target-groups`, endpoint introduit par
 *    ce chantier pour remplacer, côté changement de groupe, la recherche de groupes supprimée
 *    (D.2) — restreint au même Professeur. (La restriction elle-même, RM-CHG-010/ERR-CHG-008, a
 *    déjà sa propre couverture dans group-change.e2e-spec.ts ; ce fichier teste le NOUVEL
 *    endpoint de listing.)
 *  - RM-PAR-019/026, ERR-PAR-020 : cloisonnement croisé refusé, jamais de divulgation d'existence
 *    (réponse identique — liste vide — qu'une ressource n'existe pas ou appartienne à un autre
 *    Parent), sur les endpoints ci-dessus et sur `GET /parent-profile/me/pending-assignments`.
 *  - RM-PAR-022, RM-POOL-006/010 : la donnée qui pilote le masquage du niveau 2 de navigation
 *    (Ch. D.3 : "une seule matière et rien en attente -> niveau masqué") — aucun harnais de test
 *    frontend n'existe dans ce dépôt (voir le rapport de mission), donc l'invariant qui pilote
 *    effectivement ce masquage est vérifié ici, côté API : `pending-assignments` cesse de renvoyer
 *    un rattachement dès qu'une inscription standard active existe chez le même Professeur.
 *
 * Les modules `parent-invitations`/`level-pools` (Ch. A/B, chantier séparé) ne sont pas encore
 * présents dans cet arbre : les lignes `LevelPoolMembership`/`Group(kind=LEVEL_POOL)` nécessaires
 * aux scénarios sont donc créées directement via Prisma, comme le ferait ce module une fois livré.
 * All accounts use the `e2e-par-` email prefix, reserved for this suite.
 */
describe('Parent portal cloisonné (Avenant 01, Ch. D) (e2e)', () => {
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
    const identifier = `e2epar-${role.toLowerCase()}-${label}-${runId}`;
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
      await grantActiveSubscription(prisma, userId, academicYearId);
    } else {
      await prisma.parentProfile.update({ where: { id: userId }, data: { validatedAt: new Date() } });
    }

    const loginRes = await api().post('/api/v1/auth/login').send({ identifier, password }).expect(200);
    return { id: userId, identifier, token: loginRes.body.accessToken as string };
  }

  async function createStudent(parentToken: string, label: string): Promise<any> {
    const res = await api()
      .post('/api/v1/parent-profile/me/students')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ firstName: 'Enfant', lastName: label, schoolLevelId, schoolId })
      .expect(201);
    return res.body;
  }

  const SCHEDULE_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;
  let scheduleSeq = 0;
  function nextSchedule() {
    const seq = scheduleSeq++;
    const dayOfWeek = SCHEDULE_DAYS[seq % SCHEDULE_DAYS.length];
    const hour = 8 + (Math.floor(seq / SCHEDULE_DAYS.length) % 12);
    return { dayOfWeek, startTime: `${String(hour).padStart(2, '0')}:00`, durationMinutes: 60 };
  }

  async function createOpenGroup(teacherToken: string, name: string, capacity = 10): Promise<any> {
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
    const openRes = await api()
      .post(`/api/v1/groups/${res.body.id}/open`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(201);
    return openRes.body;
  }

  /** Ch. B (chantier séparé, pas encore présent dans cet arbre) : groupe de niveau (salle
   *  d'attente) créé directement en base, comme le ferait ce module une fois livré. */
  async function createLevelPoolGroup(teacherId: string): Promise<{ id: string }> {
    const existing = await prisma.group.findFirst({
      where: { teacherId, schoolLevelId, academicYearId, kind: 'LEVEL_POOL' },
      select: { id: true },
    });
    if (existing) return existing;
    return prisma.group.create({
      data: {
        teacherId,
        subjectId: null,
        schoolLevelId,
        academicYearId,
        name: `E2E-PAR Salle d'attente ${runId}`,
        capacity: 0,
        publicPrice: 0,
        teachingMode: 'PRESENTIAL',
        absenceBillingPolicy: 'ALL_BILLED',
        visibilityWhenFull: 'VISIBLE',
        startDate: new Date(today),
        status: 'ACTIVE',
        kind: 'LEVEL_POOL',
      },
      select: { id: true },
    });
  }

  async function attachToLevelPool(studentId: string, groupId: string) {
    return prisma.levelPoolMembership.create({
      data: { studentId, groupId, status: 'ACTIVE', source: 'TEACHER_MANUAL' },
      select: { id: true },
    });
  }

  async function createFutureAcademicYear(label: string): Promise<string> {
    const year = await prisma.academicYear.create({
      data: {
        label: `E2E-PAR ${label} ${runId}`,
        startDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 550 * 24 * 60 * 60 * 1000),
        status: 'OPEN',
      },
    });
    return year.id;
  }

  let teacherLinked: Actor; // déjà rattaché/inscrit par au moins un enfant de parent1
  let teacherStranger: Actor; // jamais lié à aucun enfant de parent1
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
    if (!subjectLevel) {
      throw new Error(
        'Aucune combinaison matière/niveau trouvée dans groupi_test — lancez `npx prisma db seed` avec DATABASE_URL pointant sur groupi_test.',
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

    teacherLinked = await registerAndActivate('TEACHER', `linked-${runId}`);
    teacherStranger = await registerAndActivate('TEACHER', `stranger-${runId}`);
    parent1 = await registerAndActivate('PARENT', `p1-${runId}`);
    parent2 = await registerAndActivate('PARENT', `p2-${runId}`);
  });

  afterAll(async () => {
    const teacherIds = [teacherLinked?.id, teacherStranger?.id].filter(Boolean) as string[];
    const parentIds = [parent1?.id, parent2?.id].filter(Boolean) as string[];
    const userIds = [...teacherIds, ...parentIds];

    if (userIds.length > 0) {
      const groups = await prisma.group.findMany({ where: { teacherId: { in: teacherIds } }, select: { id: true } });
      const groupIds = groups.map((g) => g.id);
      const students = await prisma.student.findMany({ where: { parentId: { in: parentIds } }, select: { id: true } });
      const studentIds = students.map((s) => s.id);

      await prisma.levelPoolMembership.deleteMany({ where: { OR: [{ groupId: { in: groupIds } }, { studentId: { in: studentIds } }] } });

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
      await prisma.preEnrollment.deleteMany({ where: { OR: [{ teacherId: { in: teacherIds } }, { studentId: { in: studentIds } }] } });
      await prisma.groupSchedule.deleteMany({ where: { groupId: { in: groupIds } } });
      await prisma.group.deleteMany({ where: { id: { in: groupIds } } });

      if (studentIds.length > 0) {
        await prisma.student.updateMany({ where: { id: { in: studentIds } }, data: { currentSchoolSituationId: null } });
        await prisma.studentSchoolSituation.deleteMany({ where: { studentId: { in: studentIds } } });
        await prisma.student.deleteMany({ where: { id: { in: studentIds } } });
      }
      await prisma.academicYear.deleteMany({ where: { label: { contains: `E2E-PAR` } } });

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

  describe('RM-PAR-024/ERR-PAR-021 : préinscription restreinte au Professeur déjà lié', () => {
    it('liste vide (aucun Professeur éligible) pour un enfant sans aucun lien', async () => {
      const student = await createStudent(parent1.token, `pre-none-${runId}`);
      const res = await api()
        .get(`/api/v1/pre-enrollments/eligible-teachers?studentId=${student.id}`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      expect(res.body).toEqual([]);
    });

    it('refuse la création vers un Professeur non lié -> 400 (RM-PAR-024/ERR-PAR-021)', async () => {
      const student = await createStudent(parent1.token, `pre-refuse-${runId}`);
      const futureYearId = await createFutureAcademicYear('refuse');
      const res = await api()
        .post('/api/v1/pre-enrollments')
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ studentId: student.id, teacherId: teacherStranger.id, schoolLevelId, academicYearId: futureYearId })
        .expect(400);
      expect(res.body.message).toMatch(/RM-PAR-024|ERR-PAR-021/);
    });

    it("liste et autorise le Professeur une fois l'enfant rattaché à sa salle d'attente", async () => {
      const student = await createStudent(parent1.token, `pre-pool-${runId}`);
      const pool = await createLevelPoolGroup(teacherLinked.id);
      await attachToLevelPool(student.id, pool.id);

      const listRes = await api()
        .get(`/api/v1/pre-enrollments/eligible-teachers?studentId=${student.id}`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      expect(listRes.body.map((t: any) => t.id)).toContain(teacherLinked.id);

      const futureYearId = await createFutureAcademicYear('pool');
      await api()
        .post('/api/v1/pre-enrollments')
        .set('Authorization', `Bearer ${parent1.token}`)
        .send({ studentId: student.id, teacherId: teacherLinked.id, schoolLevelId, academicYearId: futureYearId })
        .expect(201);
    });

    it("liste et autorise le Professeur si l'enfant a déjà été inscrit (Enrollment, même archivée)", async () => {
      const student = await createStudent(parent1.token, `pre-hist-${runId}`);
      const group = await createOpenGroup(teacherLinked.token, `E2E-PAR Groupe Hist ${runId}`);
      const enrollment = await createPendingEnrollmentDirect(prisma, student.id, group.id);
      await prisma.enrollment.update({ where: { id: enrollment.id }, data: { status: 'ARCHIVED' } });

      const listRes = await api()
        .get(`/api/v1/pre-enrollments/eligible-teachers?studentId=${student.id}`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      expect(listRes.body.map((t: any) => t.id)).toContain(teacherLinked.id);
    });

    it("ERR-PAR-020 : un enfant d'un autre Parent renvoie une liste vide, jamais celle d'un autre compte", async () => {
      const studentOfParent2 = await createStudent(parent2.token, `pre-other-${runId}`);
      const res = await api()
        .get(`/api/v1/pre-enrollments/eligible-teachers?studentId=${studentOfParent2.id}`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('RM-PAR-025/ERR-PAR-022 : GET /group-changes/eligible-target-groups', () => {
    it('propose un autre groupe du même Professeur, même matière/niveau, hors le groupe d’origine', async () => {
      const student = await createStudent(parent1.token, `chg-ok-${runId}`);
      const groupOrigin = await createOpenGroup(teacherLinked.token, `E2E-PAR Origine ${runId}`);
      const groupTarget = await createOpenGroup(teacherLinked.token, `E2E-PAR Cible ${runId}`);
      const pending = await createPendingEnrollmentDirect(prisma, student.id, groupOrigin.id);
      await api()
        .post(`/api/v1/groups/${groupOrigin.id}/enrollments/${pending.id}/accept`)
        .set('Authorization', `Bearer ${teacherLinked.token}`)
        .send({})
        .expect(201);

      const res = await api()
        .get(`/api/v1/group-changes/eligible-target-groups?enrollmentId=${pending.id}`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);

      const ids = res.body.map((g: any) => g.id);
      expect(ids).toContain(groupTarget.id);
      expect(ids).not.toContain(groupOrigin.id);
    });

    it("n'inclut jamais un groupe d'un autre Professeur, même même matière/niveau (RM-PAR-025/ERR-PAR-022)", async () => {
      const student = await createStudent(parent1.token, `chg-cross-${runId}`);
      const groupOrigin = await createOpenGroup(teacherLinked.token, `E2E-PAR Origine2 ${runId}`);
      const groupOtherTeacher = await createOpenGroup(teacherStranger.token, `E2E-PAR AutreProf ${runId}`);
      const pending = await createPendingEnrollmentDirect(prisma, student.id, groupOrigin.id);
      await api()
        .post(`/api/v1/groups/${groupOrigin.id}/enrollments/${pending.id}/accept`)
        .set('Authorization', `Bearer ${teacherLinked.token}`)
        .send({})
        .expect(201);

      const res = await api()
        .get(`/api/v1/group-changes/eligible-target-groups?enrollmentId=${pending.id}`)
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);

      expect(res.body.map((g: any) => g.id)).not.toContain(groupOtherTeacher.id);
    });

    it("ERR-PAR-020 : une inscription d'un autre Parent renvoie une liste vide, jamais une erreur qui confirmerait son existence", async () => {
      const studentOfParent1 = await createStudent(parent1.token, `chg-owner-${runId}`);
      const group = await createOpenGroup(teacherLinked.token, `E2E-PAR OwnerCheck ${runId}`);
      const pending = await createPendingEnrollmentDirect(prisma, studentOfParent1.id, group.id);
      await api()
        .post(`/api/v1/groups/${group.id}/enrollments/${pending.id}/accept`)
        .set('Authorization', `Bearer ${teacherLinked.token}`)
        .send({})
        .expect(201);

      const res = await api()
        .get(`/api/v1/group-changes/eligible-target-groups?enrollmentId=${pending.id}`)
        .set('Authorization', `Bearer ${parent2.token}`)
        .expect(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('RM-PAR-019/026, ERR-PAR-020, RM-POOL-006/010, RM-PAR-022/023 : GET /parent-profile/me/pending-assignments', () => {
    it("expose le rattachement en attente d'affectation (chez quel Professeur, quel niveau — jamais un groupe standard)", async () => {
      const student = await createStudent(parent1.token, `pool-view-${runId}`);
      const pool = await createLevelPoolGroup(teacherLinked.id);
      await attachToLevelPool(student.id, pool.id);

      const res = await api()
        .get('/api/v1/parent-profile/me/pending-assignments')
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);

      const entry = res.body.find((p: any) => p.studentId === student.id);
      expect(entry).toBeDefined();
      expect(entry.teacher.firstName).toBeDefined();
      expect(entry.schoolLevel.name).toBeDefined();
      // RM-POOL-010/RM-PAR-023 : jamais un nom de groupe standard ni un identifiant d'un autre élève.
      expect(entry.groupName).toBeUndefined();
      expect(entry.group).toBeUndefined();
    });

    it(
      "RM-POOL-006/RM-PAR-022 : disparaît (donnée qui pilote le masquage niveau 2) dès qu'une inscription " +
        'standard active existe chez ce même Professeur — le rattachement, lui, reste actif (RM-POOL-006)',
      async () => {
        const student = await createStudent(parent1.token, `pool-hide-${runId}`);
        const pool = await createLevelPoolGroup(teacherLinked.id);
        const membership = await attachToLevelPool(student.id, pool.id);

        const beforeRes = await api()
          .get('/api/v1/parent-profile/me/pending-assignments')
          .set('Authorization', `Bearer ${parent1.token}`)
          .expect(200);
        expect(beforeRes.body.some((p: any) => p.studentId === student.id)).toBe(true);

        // Ch. C (affectation, module séparé) : simule l'activation d'une inscription standard.
        const standardGroup = await createOpenGroup(teacherLinked.token, `E2E-PAR StandardAffecte ${runId}`);
        const pending = await createPendingEnrollmentDirect(prisma, student.id, standardGroup.id);
        await api()
          .post(`/api/v1/groups/${standardGroup.id}/enrollments/${pending.id}/accept`)
          .set('Authorization', `Bearer ${teacherLinked.token}`)
          .send({})
          .expect(201);

        const afterRes = await api()
          .get('/api/v1/parent-profile/me/pending-assignments')
          .set('Authorization', `Bearer ${parent1.token}`)
          .expect(200);
        expect(afterRes.body.some((p: any) => p.studentId === student.id)).toBe(false);

        // RM-POOL-006 : le rattachement à la salle d'attente reste actif malgré l'affectation.
        const stillActive = await prisma.levelPoolMembership.findUniqueOrThrow({ where: { id: membership.id } });
        expect(stillActive.status).toBe('ACTIVE');
      },
    );

    it("ERR-PAR-020 : ne renvoie jamais un rattachement d'un enfant qui n'est pas le mien", async () => {
      const studentOfParent2 = await createStudent(parent2.token, `pool-other-${runId}`);
      const pool = await createLevelPoolGroup(teacherLinked.id);
      await attachToLevelPool(studentOfParent2.id, pool.id);

      const res = await api()
        .get('/api/v1/parent-profile/me/pending-assignments')
        .set('Authorization', `Bearer ${parent1.token}`)
        .expect(200);
      expect(res.body.some((p: any) => p.studentId === studentOfParent2.id)).toBe(false);
    });
  });
});
