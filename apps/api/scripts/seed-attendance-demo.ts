/**
 * Local demo data for testing the attendance workflow end-to-end.
 *
 * Creates/reuses:
 * - prof1@test.com / parent1@test.com, password admin-local
 * - an open demo academic year covering today
 * - one active group with two active students
 * - one PLANNED session today, ready for attendance entry
 * - accounting accounts + an active Pro subscription for the teacher
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
import { join } from 'node:path';

dotenv.config({ path: join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

const PASSWORD = 'admin-local';
const TEACHER_EMAIL = 'prof1@test.com';
const PARENT_EMAIL = 'parent1@test.com';

function dateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function dayOfWeek(date: Date) {
  return ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][
    date.getUTCDay()
  ] as 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
}

async function upsertDemoUser(params: {
  email: string;
  roles: ('TEACHER' | 'PARENT')[];
  firstName: string;
  lastName: string;
}) {
  const passwordHash = await argon2.hash(PASSWORD, { type: argon2.argon2id });
  return prisma.user.upsert({
    where: { email: params.email },
    update: {
      passwordHash,
      status: 'ACTIVE',
      roles: params.roles,
      emailVerifiedAt: new Date(),
      acceptedTermsAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
      tokenVersion: { increment: 1 },
    },
    create: {
      email: params.email,
      passwordHash,
      status: 'ACTIVE',
      roles: params.roles,
      emailVerifiedAt: new Date(),
      acceptedTermsAt: new Date(),
    },
  });
}

async function findOrCreateStudent(parentId: string, firstName: string, lastName: string) {
  const existing = await prisma.student.findFirst({ where: { parentId, firstName, lastName } });
  if (existing) return existing;
  return prisma.student.create({
    data: { parentId, firstName, lastName, status: 'ACTIVE' },
  });
}

async function main() {
  const today = dateOnly(new Date());
  const now = new Date();

  const subjectLevel = await prisma.subjectLevel.findFirst({
    where: { isActive: true, isAllowed: true, subject: { isActive: true }, schoolLevel: { isActive: true } },
    include: { subject: true, schoolLevel: true },
    orderBy: { id: 'asc' },
  });
  if (!subjectLevel) {
    throw new Error('Aucune combinaison matiere/niveau active. Lance d’abord `npm run prisma:seed --workspace apps/api`.');
  }

  const school = await prisma.school.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
  if (!school) {
    throw new Error('Aucun etablissement actif. Lance d’abord `npm run prisma:seed --workspace apps/api`.');
  }

  const academicYear = await prisma.academicYear.upsert({
    where: { label: 'DEMO-PRESENCES-2026' },
    update: {
      startDate: addDays(today, -7),
      endDate: addDays(today, 120),
      status: 'OPEN',
    },
    create: {
      label: 'DEMO-PRESENCES-2026',
      startDate: addDays(today, -7),
      endDate: addDays(today, 120),
      status: 'OPEN',
    },
  });

  const teacherUser = await upsertDemoUser({
    email: TEACHER_EMAIL,
    roles: ['TEACHER'],
    firstName: 'Prof',
    lastName: 'Demo',
  });
  const parentUser = await upsertDemoUser({
    email: PARENT_EMAIL,
    roles: ['PARENT'],
    firstName: 'Parent',
    lastName: 'Demo',
  });

  await prisma.teacherProfile.upsert({
    where: { id: teacherUser.id },
    update: {
      firstName: 'Prof',
      lastName: 'Demo',
      phone: '+216 20 000 001',
      city: 'Tunis',
      status: 'VALIDATED',
      completenessScore: 100,
    },
    create: {
      id: teacherUser.id,
      firstName: 'Prof',
      lastName: 'Demo',
      phone: '+216 20 000 001',
      city: 'Tunis',
      status: 'VALIDATED',
      completenessScore: 100,
    },
  });
  await prisma.parentProfile.upsert({
    where: { id: parentUser.id },
    update: { firstName: 'Parent', lastName: 'Demo', phone: '+216 20 000 002', city: 'Tunis', validatedAt: now },
    create: {
      id: parentUser.id,
      firstName: 'Parent',
      lastName: 'Demo',
      phone: '+216 20 000 002',
      city: 'Tunis',
      validatedAt: now,
    },
  });

  await prisma.teacherSubject.upsert({
    where: { teacherProfileId_subjectId: { teacherProfileId: teacherUser.id, subjectId: subjectLevel.subjectId } },
    update: {},
    create: { teacherProfileId: teacherUser.id, subjectId: subjectLevel.subjectId },
  });
  await prisma.teacherSchoolLevel.upsert({
    where: {
      teacherProfileId_schoolLevelId: {
        teacherProfileId: teacherUser.id,
        schoolLevelId: subjectLevel.schoolLevelId,
      },
    },
    update: {},
    create: { teacherProfileId: teacherUser.id, schoolLevelId: subjectLevel.schoolLevelId },
  });

  const location = await prisma.teachingLocation.upsert({
    where: { id: '00000000-0000-4000-8000-000000000101' },
    update: { teacherId: teacherUser.id, label: 'Salle demo presences', address: 'Tunis', isActive: true },
    create: {
      id: '00000000-0000-4000-8000-000000000101',
      teacherId: teacherUser.id,
      label: 'Salle demo presences',
      address: 'Tunis',
      isActive: true,
    },
  });

  const group = await prisma.group.upsert({
    where: { id: '00000000-0000-4000-8000-000000000201' },
    update: {
      teacherId: teacherUser.id,
      subjectId: subjectLevel.subjectId,
      schoolLevelId: subjectLevel.schoolLevelId,
      academicYearId: academicYear.id,
      name: `Demo appel - ${subjectLevel.subject.name}`,
      capacity: 10,
      publicPrice: 30,
      teachingMode: 'PRESENTIAL',
      absenceBillingPolicy: 'EXCUSED_NOT_BILLED',
      abandonmentThreshold: 3,
      debtAlertThresholdSessions: 2,
      visibilityWhenFull: 'VISIBLE',
      startDate: addDays(today, -7),
      endDate: addDays(today, 120),
      status: 'ACTIVE',
    },
    create: {
      id: '00000000-0000-4000-8000-000000000201',
      teacherId: teacherUser.id,
      subjectId: subjectLevel.subjectId,
      schoolLevelId: subjectLevel.schoolLevelId,
      academicYearId: academicYear.id,
      name: `Demo appel - ${subjectLevel.subject.name}`,
      capacity: 10,
      publicPrice: 30,
      teachingMode: 'PRESENTIAL',
      absenceBillingPolicy: 'EXCUSED_NOT_BILLED',
      abandonmentThreshold: 3,
      debtAlertThresholdSessions: 2,
      visibilityWhenFull: 'VISIBLE',
      startDate: addDays(today, -7),
      endDate: addDays(today, 120),
      status: 'ACTIVE',
    },
  });

  await prisma.groupSchedule.upsert({
    where: { id: '00000000-0000-4000-8000-000000000301' },
    update: {
      groupId: group.id,
      dayOfWeek: dayOfWeek(today),
      startTime: '18:00',
      durationMinutes: 60,
      teachingLocationId: location.id,
    },
    create: {
      id: '00000000-0000-4000-8000-000000000301',
      groupId: group.id,
      dayOfWeek: dayOfWeek(today),
      startTime: '18:00',
      durationMinutes: 60,
      teachingLocationId: location.id,
    },
  });

  const students = [
    await findOrCreateStudent(parentUser.id, 'Yasmine', 'Demo'),
    await findOrCreateStudent(parentUser.id, 'Adam', 'Demo'),
  ];

  const period = await prisma.accountingPeriod.upsert({
    where: { academicYearId: academicYear.id },
    update: { openDate: academicYear.startDate, closeDate: academicYear.endDate, status: 'OPEN', lockedAt: null },
    create: {
      academicYearId: academicYear.id,
      openDate: academicYear.startDate,
      closeDate: academicYear.endDate,
      status: 'OPEN',
    },
  });

  const enrollments = [];
  for (const student of students) {
    const situation =
      (await prisma.studentSchoolSituation.findFirst({
        where: { studentId: student.id, academicYearId: academicYear.id, status: 'ACTIVE' },
      })) ??
      (await prisma.studentSchoolSituation.create({
        data: {
          studentId: student.id,
          academicYearId: academicYear.id,
          schoolLevelId: subjectLevel.schoolLevelId,
          schoolId: school.id,
          class: 'Demo',
          startDate: academicYear.startDate,
          status: 'ACTIVE',
        },
      }));
    await prisma.student.update({ where: { id: student.id }, data: { currentSchoolSituationId: situation.id, status: 'ACTIVE' } });

    const enrollment =
      (await prisma.enrollment.findFirst({ where: { studentId: student.id, groupId: group.id } })) ??
      (await prisma.enrollment.create({
        data: {
          studentId: student.id,
          groupId: group.id,
          status: 'ACTIVE',
          customPrice: 30,
          paymentMethod: 'cash',
          requestedAt: now,
          decidedAt: now,
          decidedById: teacherUser.id,
        },
      }));
    const activeEnrollment = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'ACTIVE', customPrice: 30, decidedAt: now, decidedById: teacherUser.id },
    });
    enrollments.push(activeEnrollment);

    await prisma.accountingAccount.upsert({
      where: { enrollmentId: activeEnrollment.id },
      update: { periodId: period.id, status: 'ACTIVE', lockedAt: null, closedAt: null, archivedAt: null },
      create: { enrollmentId: activeEnrollment.id, periodId: period.id, status: 'ACTIVE' },
    });
  }

  const session = await prisma.session.upsert({
    where: { id: '00000000-0000-4000-8000-000000000401' },
    update: {
      groupId: group.id,
      date: today,
      startTime: '18:00',
      durationMinutes: 60,
      teachingMode: 'PRESENTIAL',
      teachingLocationId: location.id,
      status: 'PLANNED',
      lockedAt: null,
    },
    create: {
      id: '00000000-0000-4000-8000-000000000401',
      groupId: group.id,
      date: today,
      startTime: '18:00',
      durationMinutes: 60,
      teachingMode: 'PRESENTIAL',
      teachingLocationId: location.id,
      status: 'PLANNED',
    },
  });
  await prisma.attendance.deleteMany({ where: { sessionId: session.id } });

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { code: 'PRO' },
    update: { name: 'Pro', price: 99, maxActiveEnrollments: null, durationDays: null, isTrial: false },
    create: { code: 'PRO', name: 'Pro', price: 99, maxActiveEnrollments: null, durationDays: null, isTrial: false },
  });
  await prisma.subscription.upsert({
    where: { teacherId_academicYearId: { teacherId: teacherUser.id, academicYearId: academicYear.id } },
    update: { planId: proPlan.id, status: 'ACTIVE', activatedAt: now, expiresAt: academicYear.endDate },
    create: {
      teacherId: teacherUser.id,
      planId: proPlan.id,
      academicYearId: academicYear.id,
      status: 'ACTIVE',
      requestedAt: now,
      activatedAt: now,
      expiresAt: academicYear.endDate,
    },
  });

  console.log('Demo presences prete.');
  console.log(`Professeur : ${TEACHER_EMAIL} / ${PASSWORD}`);
  console.log(`Parent     : ${PARENT_EMAIL} / ${PASSWORD}`);
  console.log(`Groupe     : ${group.name}`);
  console.log(`Seance     : ${today.toISOString().slice(0, 10)} a 18:00`);
  console.log(`Eleves     : ${students.map((s) => `${s.firstName} ${s.lastName}`).join(', ')}`);
  console.log(`URL        : /teacher/sessions/${session.id}/attendance`);
}

main()
  .catch((error) => {
    console.error('Echec du seed demo presences :', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
