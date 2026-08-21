// A lancer depuis apps/api : node scripts/deploy-prod-migrations.js
// Applique les 5 migrations Prisma manquantes sur la base de prod (Neon), avec correction
// manuelle de la migration partie4 (ADD COLUMN NOT NULL sans defaut, incompatible avec les
// tables non vides city/school/school_level/subject/subject_level en prod).

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.production.local') });

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url || !url.includes('neon.tech')) {
  console.error('ABORT: DATABASE_URL_UNPOOLED introuvable ou ne pointe pas vers neon.tech');
  process.exit(1);
}

const env = { ...process.env, DATABASE_URL: url };

function run(cmd, { allowFail = false } = {}) {
  console.log(`\n$ ${cmd}`);
  try {
    const out = execSync(cmd, { env, encoding: 'utf8', cwd: path.join(__dirname, '..') });
    console.log(out);
    return { ok: true, out };
  } catch (e) {
    console.log(e.stdout || '');
    console.log(e.stderr || '');
    if (!allowFail) {
      console.error('ABORT: commande échouée de manière inattendue.');
      process.exit(1);
    }
    return { ok: false, out: (e.stdout || '') + (e.stderr || '') };
  }
}

console.log('== Etape 1/4 : deploiement des migrations sures (1 et 2) ==');
run('npx prisma migrate deploy', { allowFail: true });

console.log('\n== Etape 2/4 : correction manuelle de partie4_referentiels_updated_at ==');
const sql = `
ALTER TABLE "city" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "school" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "school_level" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "subject" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "subject_level" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "subject_level" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
`;
const sqlFile = path.join(__dirname, '_fix-partie4.sql');
fs.writeFileSync(sqlFile, sql, { encoding: 'utf8' });
run(`npx prisma db execute --file "${sqlFile}" --schema prisma/schema.prisma`);
fs.unlinkSync(sqlFile);

console.log('\n== Etape 3/4 : marquage de la migration comme appliquee ==');
run('npx prisma migrate resolve --applied 20260810152700_partie4_referentiels_updated_at', { allowFail: true });

console.log('\n== Etape 4/4 : deploiement des migrations restantes ==');
run('npx prisma migrate deploy');

console.log('\n== Verification finale ==');
run('npx prisma migrate status');
