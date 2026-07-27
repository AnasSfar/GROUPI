// GROUPI — seed de développement pour le domaine Référentiels
// Source de vérité : fichiers officiels dans prisma/reference-data, générés depuis
// gps_etablissements_scolaires.xls et levelsubject.xlsx.
//
// Idempotent : les référentiels sont rejouables sans duplication grâce aux clés uniques
// (code pour matières/niveaux, name pour villes, sourceKey GPS pour établissements).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient, SchoolType, AcademicYearStatus } from '@prisma/client';

/// Ch.4.3/21.3 : catalogue commercial des 3 offres — tarifs/capacités définis dans le cadre
/// général, indépendants des règles fonctionnelles (Ch.21.2). Découverte : gratuite, 30 jours,
/// utilisable une seule fois par Professeur (RM-SUB-005, `isTrial`).
const SUBSCRIPTION_PLANS = [
  { code: 'DECOUVERTE', name: 'Découverte', price: 0, maxActiveEnrollments: 20, durationDays: 30, isTrial: true },
  { code: 'INTERMEDIAIRE', name: 'Intermédiaire', price: 49, maxActiveEnrollments: 50, durationDays: null, isTrial: false },
  { code: 'PRO', name: 'Pro', price: 99, maxActiveEnrollments: null, durationDays: null, isTrial: false },
] as const;

const prisma = new PrismaClient();

type ReferenceSubject = { name: string; code: string };
type ReferenceSchoolLevel = { name: string; code: string; order: number };
type ReferenceSubjectLevel = { subjectCode: string; schoolLevelCode: string };
type ReferenceSchool = {
  sourceKey: string;
  officialCode: string;
  autoCode: string | null;
  name: string;
  nameAr: string | null;
  type: SchoolType;
  cityName: string;
  regionalDirectorate: string | null;
  regionalDirectorateAr: string | null;
  delegation: string | null;
  delegationAr: string | null;
  regionAr: string | null;
  cycleAr: string | null;
  latitude: number | null;
  longitude: number | null;
};

function readReferenceData<T>(fileName: string): T {
  const fullPath = join(__dirname, 'reference-data', fileName);
  return JSON.parse(readFileSync(fullPath, 'utf8')) as T;
}

const CITIES = readReferenceData<string[]>('cities.json');
const SCHOOLS = readReferenceData<ReferenceSchool[]>('schools.json');
const SUBJECTS = readReferenceData<ReferenceSubject[]>('subjects.json');
const SCHOOL_LEVELS = readReferenceData<ReferenceSchoolLevel[]>('school-levels.json');
const SUBJECT_LEVELS = readReferenceData<ReferenceSubjectLevel[]>('subject-levels.json');

async function main() {
  console.log('Seed GROUPI — domaine Référentiels\n');

  // --- Villes / délégations ---------------------------------------------
  let citiesCount = 0;
  const cityIdByName = new Map<string, string>();
  for (const name of CITIES) {
    const city = await prisma.city.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
    cityIdByName.set(name, city.id);
    citiesCount++;
  }
  console.log(`Villes : ${citiesCount} upserted`);

  // --- Établissements scolaires officiels GPS ----------------------------
  let schoolsCount = 0;
  for (const school of SCHOOLS) {
    const cityId = cityIdByName.get(school.cityName);
    if (!cityId) {
      throw new Error(`Ville inconnue pour l'établissement "${school.name}": ${school.cityName}`);
    }

    await prisma.school.upsert({
      where: { sourceKey: school.sourceKey },
      update: {
        officialCode: school.officialCode,
        autoCode: school.autoCode,
        name: school.name,
        nameAr: school.nameAr,
        type: school.type,
        cityId,
        regionalDirectorate: school.regionalDirectorate,
        regionalDirectorateAr: school.regionalDirectorateAr,
        delegation: school.delegation,
        delegationAr: school.delegationAr,
        regionAr: school.regionAr,
        cycleAr: school.cycleAr,
        latitude: school.latitude,
        longitude: school.longitude,
        isActive: true,
      },
      create: {
        sourceKey: school.sourceKey,
        officialCode: school.officialCode,
        autoCode: school.autoCode,
        name: school.name,
        nameAr: school.nameAr,
        type: school.type,
        cityId,
        regionalDirectorate: school.regionalDirectorate,
        regionalDirectorateAr: school.regionalDirectorateAr,
        delegation: school.delegation,
        delegationAr: school.delegationAr,
        regionAr: school.regionAr,
        cycleAr: school.cycleAr,
        latitude: school.latitude,
        longitude: school.longitude,
        isActive: true,
      },
    });
    schoolsCount++;
  }
  console.log(`Établissements : ${schoolsCount} upserted`);

  // --- Matières -----------------------------------------------------------
  await prisma.subject.updateMany({ data: { isActive: false } });
  let subjectsCount = 0;
  const subjectIdByCode = new Map<string, string>();
  for (const subject of SUBJECTS) {
    const created = await prisma.subject.upsert({
      where: { code: subject.code },
      update: { name: subject.name, isActive: true },
      create: { name: subject.name, code: subject.code, isActive: true },
    });
    subjectIdByCode.set(subject.code, created.id);
    subjectsCount++;
  }
  console.log(`Matières : ${subjectsCount} upserted`);

  // --- Niveaux scolaires --------------------------------------------------
  await prisma.schoolLevel.updateMany({ data: { isActive: false } });
  let levelsCount = 0;
  const levelIdByCode = new Map<string, string>();
  for (const level of SCHOOL_LEVELS) {
    const created = await prisma.schoolLevel.upsert({
      where: { code: level.code },
      update: { name: level.name, order: level.order, isActive: true },
      create: { name: level.name, code: level.code, order: level.order, isActive: true },
    });
    levelIdByCode.set(level.code, created.id);
    levelsCount++;
  }
  console.log(`Niveaux scolaires : ${levelsCount} upserted`);

  // --- Année académique ---------------------------------------------------
  const academicYear = await prisma.academicYear.upsert({
    where: { label: '2026-2027' },
    update: {
      startDate: new Date('2026-09-15'),
      endDate: new Date('2027-06-30'),
      status: AcademicYearStatus.OPEN,
    },
    create: {
      label: '2026-2027',
      startDate: new Date('2026-09-15'),
      endDate: new Date('2027-06-30'),
      status: AcademicYearStatus.OPEN,
    },
  });
  console.log(`Année académique : 1 upserted (${academicYear.label}, ${academicYear.status})`);

  // --- Offres d'abonnement (SubscriptionPlan, Ch. 21.3) ------------------
  let plansCount = 0;
  for (const p of SUBSCRIPTION_PLANS) {
    await prisma.subscriptionPlan.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        price: p.price,
        maxActiveEnrollments: p.maxActiveEnrollments,
        durationDays: p.durationDays,
        isTrial: p.isTrial,
      },
      create: p,
    });
    plansCount++;
  }
  console.log(`Offres d'abonnement : ${plansCount} upserted`);

  // --- Combinaisons Matière/Niveau (SubjectLevel, Ch. 23.8) --------------
  await prisma.subjectLevel.updateMany({ data: { isAllowed: false, isActive: false } });
  let subjectLevelsCount = 0;
  for (const { subjectCode, schoolLevelCode } of SUBJECT_LEVELS) {
    const subjectId = subjectIdByCode.get(subjectCode);
    const schoolLevelId = levelIdByCode.get(schoolLevelCode);
    if (!subjectId || !schoolLevelId) {
      throw new Error(`Combinaison invalide subject=${subjectCode} level=${schoolLevelCode}`);
    }
    await prisma.subjectLevel.upsert({
      where: { subjectId_schoolLevelId: { subjectId, schoolLevelId } },
      update: { isAllowed: true, isActive: true },
      create: { subjectId, schoolLevelId, isAllowed: true, isActive: true },
    });
    subjectLevelsCount++;
  }
  console.log(`Combinaisons Matière/Niveau : ${subjectLevelsCount} upserted`);

  console.log('\nRésumé :');
  console.log(`  - City         : ${citiesCount}`);
  console.log(`  - School       : ${schoolsCount}`);
  console.log(`  - Subject      : ${subjectsCount}`);
  console.log(`  - SchoolLevel  : ${levelsCount}`);
  console.log('  - AcademicYear : 1');
  console.log(`  - SubscriptionPlan : ${plansCount}`);
  console.log(`  - SubjectLevel : ${subjectLevelsCount}`);
  console.log('\nSeed terminé avec succès.');
}

main()
  .catch((error) => {
    console.error('Erreur durant le seed :', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
