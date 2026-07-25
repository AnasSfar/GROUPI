// GROUPI — seed de développement pour le domaine Référentiels
// (villes, établissements, matières, niveaux scolaires, année académique,
// combinaisons matière/niveau — référentiel Ch. 23.8).
//
// Idempotent : entièrement basé sur `upsert` sur les clés uniques du schéma,
// donc rejouable sans erreur de duplication (`npx prisma db seed`).

import { PrismaClient, SchoolType, AcademicYearStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Données — Villes tunisiennes
// ---------------------------------------------------------------------------

const CITIES = [
  'Tunis',
  'Sfax',
  'Sousse',
  'Ariana',
  'Ben Arous',
  'Nabeul',
  'Bizerte',
  'Gabès',
  'Kairouan',
  'Monastir',
  'La Marsa',
  'Manouba',
  'Gafsa',
  'Médenine',
  'Mahdia',
  'Kasserine',
  'Sidi Bouzid',
  'Tozeur',
  'Zaghouan',
];

// ---------------------------------------------------------------------------
// Données — Établissements (quelques-uns par grande ville)
// ---------------------------------------------------------------------------

const SCHOOLS: {
  name: string;
  type: SchoolType;
  city: string;
  address?: string;
}[] = [
  // Tunis
  { name: 'Lycée Pilote Bourguiba Tunis', type: SchoolType.HIGH_SCHOOL, city: 'Tunis', address: 'Avenue Bab Bnet, Tunis' },
  { name: 'Collège Ibn Khaldoun Tunis', type: SchoolType.COLLEGE, city: 'Tunis', address: 'Rue de Marseille, Tunis' },
  { name: 'École Primaire Khaznadar', type: SchoolType.PRIMARY, city: 'Tunis' },

  // Sfax
  { name: 'Lycée Sfax Pilote', type: SchoolType.HIGH_SCHOOL, city: 'Sfax', address: 'Route de l’Aéroport, Sfax' },
  { name: 'Collège Habib Bourguiba Sfax', type: SchoolType.COLLEGE, city: 'Sfax' },
  { name: 'École Primaire Hached Sfax', type: SchoolType.PRIMARY, city: 'Sfax' },

  // Sousse
  { name: 'Lycée Sousse Pilote', type: SchoolType.HIGH_SCHOOL, city: 'Sousse', address: 'Boulevard 14 Janvier, Sousse' },
  { name: 'Collège Farhat Hached Sousse', type: SchoolType.COLLEGE, city: 'Sousse' },
  { name: 'École Primaire Khezama Sousse', type: SchoolType.PRIMARY, city: 'Sousse' },

  // Ariana
  { name: 'Lycée Secondaire Ariana', type: SchoolType.HIGH_SCHOOL, city: 'Ariana' },
  { name: 'Collège Ariana Ville', type: SchoolType.COLLEGE, city: 'Ariana' },

  // Ben Arous
  { name: 'Lycée Secondaire Ben Arous', type: SchoolType.HIGH_SCHOOL, city: 'Ben Arous' },
  { name: 'Collège El Mourouj', type: SchoolType.COLLEGE, city: 'Ben Arous' },

  // Nabeul
  { name: 'Lycée Secondaire Nabeul', type: SchoolType.HIGH_SCHOOL, city: 'Nabeul' },
  { name: 'Collège Nabeul Centre', type: SchoolType.COLLEGE, city: 'Nabeul' },
];

// ---------------------------------------------------------------------------
// Données — Matières (curriculum tunisien standard)
// ---------------------------------------------------------------------------

const SUBJECTS = [
  { name: 'Mathématiques', code: 'MATH' },
  { name: 'Physique', code: 'PHYS' },
  { name: 'Sciences de la Vie et de la Terre', code: 'SVT' },
  { name: 'Français', code: 'FR' },
  { name: 'Anglais', code: 'ANG' },
  { name: 'Arabe', code: 'AR' },
  { name: 'Philosophie', code: 'PHILO' },
  { name: 'Histoire-Géographie', code: 'HG' },
  { name: 'Informatique', code: 'INFO' },
  { name: 'Économie', code: 'ECO' },
  { name: 'Gestion', code: 'GEST' },
  { name: 'Comptabilité', code: 'COMPTA' },
  { name: 'Éducation Islamique', code: 'ISLAM' },
  { name: 'Espagnol', code: 'ESP' },
  { name: 'Allemand', code: 'ALL' },
  { name: 'Italien', code: 'ITA' },
  { name: 'Sport / EPS', code: 'EPS' },
] as const;

// ---------------------------------------------------------------------------
// Données — Niveaux scolaires (système tunisien : primaire, collège, lycée)
// ---------------------------------------------------------------------------

const SCHOOL_LEVELS = [
  // Primaire — 1ère à 6ème année
  { name: '1ère année primaire', code: 'PRIM1', order: 1 },
  { name: '2ème année primaire', code: 'PRIM2', order: 2 },
  { name: '3ème année primaire', code: 'PRIM3', order: 3 },
  { name: '4ème année primaire', code: 'PRIM4', order: 4 },
  { name: '5ème année primaire', code: 'PRIM5', order: 5 },
  { name: '6ème année primaire', code: 'PRIM6', order: 6 },
  // Collège — 7ème, 8ème, 9ème année de base
  { name: '7ème année de base', code: 'COL7', order: 7 },
  { name: '8ème année de base', code: 'COL8', order: 8 },
  { name: '9ème année de base', code: 'COL9', order: 9 },
  // Lycée — 1ère, 2ème, 3ème, 4ème année secondaire (génériques, sans filière)
  { name: '1ère année secondaire', code: 'SEC1', order: 10 },
  { name: '2ème année secondaire', code: 'SEC2', order: 11 },
  { name: '3ème année secondaire', code: 'SEC3', order: 12 },
  { name: '4ème année secondaire (Bac)', code: 'SEC4', order: 13 },
] as const;

// Codes de niveau regroupés par cycle, pour construire les combinaisons SubjectLevel.
const PRIMARY_CODES = ['PRIM1', 'PRIM2', 'PRIM3', 'PRIM4', 'PRIM5', 'PRIM6'];
const COLLEGE_CODES = ['COL7', 'COL8', 'COL9'];
const LYCEE_CODES = ['SEC1', 'SEC2', 'SEC3', 'SEC4'];
const ALL_LEVEL_CODES = [...PRIMARY_CODES, ...COLLEGE_CODES, ...LYCEE_CODES];

// À partir de la 8ème année de base (2ème année de collège) pour les langues étrangères
// optionnelles (Espagnol/Allemand/Italien) — approximation raisonnable, non normative.
const FROM_COLLEGE_8_ONWARD = ALL_LEVEL_CODES.slice(ALL_LEVEL_CODES.indexOf('COL8'));
// Du collège au lycée pour SVT / Physique / Histoire-Géo.
const FROM_COLLEGE_ONWARD = ALL_LEVEL_CODES.slice(ALL_LEVEL_CODES.indexOf('COL7'));

/**
 * Construit la table des combinaisons Matière/Niveau autorisées (Ch. 23.8).
 * Approche volontairement simplifiée, pas une reconstitution officielle du
 * programme scolaire tunisien :
 *  - matières "tronc commun" (Maths, Français, Arabe, Anglais, Sport/EPS) : tous les niveaux
 *  - SVT, Physique, Histoire-Géo : à partir du collège
 *  - Philosophie, Économie, Gestion, Comptabilité : lycée uniquement
 *  - Informatique, Éducation Islamique : à partir du collège
 *  - Langues étrangères optionnelles (Espagnol, Allemand, Italien) : à partir de la 8ème
 */
function buildSubjectLevelCombinations(): { subjectCode: string; levelCode: string }[] {
  const combos: { subjectCode: string; levelCode: string }[] = [];

  const add = (subjectCode: string, levelCodes: string[]) => {
    for (const levelCode of levelCodes) {
      combos.push({ subjectCode, levelCode });
    }
  };

  // Tronc commun — tous les niveaux, de la 1ère primaire à la 4ème secondaire.
  add('MATH', ALL_LEVEL_CODES);
  add('FR', ALL_LEVEL_CODES);
  add('AR', ALL_LEVEL_CODES);
  add('ANG', ALL_LEVEL_CODES);
  add('EPS', ALL_LEVEL_CODES);

  // Sciences / Histoire-Géo — à partir du collège.
  add('SVT', FROM_COLLEGE_ONWARD);
  add('PHYS', FROM_COLLEGE_ONWARD);
  add('HG', FROM_COLLEGE_ONWARD);
  add('ISLAM', FROM_COLLEGE_ONWARD);
  add('INFO', FROM_COLLEGE_ONWARD);

  // Matières spécifiques au lycée.
  add('PHILO', LYCEE_CODES);
  add('ECO', LYCEE_CODES);
  add('GEST', LYCEE_CODES);
  add('COMPTA', LYCEE_CODES);

  // Langues étrangères optionnelles — à partir de la 8ème année de base.
  add('ESP', FROM_COLLEGE_8_ONWARD);
  add('ALL', FROM_COLLEGE_8_ONWARD);
  add('ITA', FROM_COLLEGE_8_ONWARD);

  return combos;
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log('Seed GROUPI — domaine Référentiels\n');

  // --- Villes -----------------------------------------------------------
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

  // --- Établissements -----------------------------------------------------
  let schoolsCount = 0;
  for (const school of SCHOOLS) {
    const cityId = cityIdByName.get(school.city);
    if (!cityId) {
      throw new Error(`Ville inconnue pour l'établissement "${school.name}": ${school.city}`);
    }
    await prisma.school.upsert({
      where: { name: school.name },
      update: {
        type: school.type,
        cityId,
        address: school.address ?? null,
        isActive: true,
      },
      create: {
        name: school.name,
        type: school.type,
        cityId,
        address: school.address ?? null,
        isActive: true,
      },
    });
    schoolsCount++;
  }
  console.log(`Établissements : ${schoolsCount} upserted`);

  // --- Matières -------------------------------------------------------------
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

  // --- Niveaux scolaires ------------------------------------------------
  let levelsCount = 0;
  const levelIdByCode = new Map<string, string>();
  for (const level of SCHOOL_LEVELS) {
    const created = await prisma.schoolLevel.upsert({
      where: { code: level.code },
      update: { name: level.name, order: level.order, isActive: true },
      create: {
        name: level.name,
        code: level.code,
        order: level.order,
        isActive: true,
      },
    });
    levelIdByCode.set(level.code, created.id);
    levelsCount++;
  }
  console.log(`Niveaux scolaires : ${levelsCount} upserted`);

  // --- Année académique ---------------------------------------------------
  // Année académique tunisienne courante : mi-septembre à fin juin.
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

  // --- Combinaisons Matière/Niveau (SubjectLevel, Ch. 23.8) --------------
  const combinations = buildSubjectLevelCombinations();
  let subjectLevelsCount = 0;
  for (const { subjectCode, levelCode } of combinations) {
    const subjectId = subjectIdByCode.get(subjectCode);
    const schoolLevelId = levelIdByCode.get(levelCode);
    if (!subjectId || !schoolLevelId) {
      throw new Error(`Combinaison invalide subject=${subjectCode} level=${levelCode}`);
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
  console.log(`  - AcademicYear : 1`);
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
