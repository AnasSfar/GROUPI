/**
 * One-shot script: creates a delegated Administrator account directly via Prisma, bypassing the
 * e-mail invitation flow (apps/api/src/admin/administrators.service.ts) — useful in local dev
 * where SMTP isn't configured, so the invited person could never receive/click the link.
 * Idempotent per e-mail. Same pattern as bootstrap-super-admin.ts.
 *
 * Usage: npx tsx scripts/create-admin.ts <email> <firstName> <lastName> <phone> [permission...]
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const ALL_PERMISSIONS = [
  'ACC_VALIDATE',
  'ACC_REASSIGN_STUDENT',
  'REF_CREATE',
  'SCH_VALIDATE',
  'SCH_ADMIN_OVERRIDE',
  'TPR_VALIDATE',
  'ABO_VALIDATE',
  'ABO_SUSPEND',
  'ABO_REACTIVATE',
  'CPT_ADMIN_ADJUST',
  'EXP_EXPORT_DATA',
  'EXP_VIEW_JOURNAL',
];

async function main() {
  const prisma = new PrismaClient();

  const email = process.argv[2] ?? 'admin2@test.com';
  const firstName = process.argv[3] ?? 'Admin';
  const lastName = process.argv[4] ?? 'Local';
  const phone = process.argv[5] ?? '20000000';
  const permissions = process.argv.slice(6).length ? process.argv.slice(6) : ALL_PERMISSIONS;
  const plainPassword = process.env.LOCAL_ADMIN_PASSWORD ?? 'admin-local';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Compte déjà présent (${email}) — rien à faire.`);
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await argon2.hash(plainPassword, { type: argon2.argon2id });
  const user = await prisma.user.create({
    data: { email, passwordHash, status: 'ACTIVE', roles: ['ADMIN'] },
  });

  // Pas de Super Admin réel à référencer ici (script hors application) — s'auto-référence.
  await prisma.administrator.create({
    data: { id: user.id, permissions, createdById: user.id, firstName, lastName, phone },
  });

  console.log(`Administrateur créé : ${user.email} (id: ${user.id})`);
  console.log(`Mot de passe : ${plainPassword}`);
  console.log(`Permissions : ${permissions.join(', ')}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Échec de la création de l’administrateur :', err);
  process.exitCode = 1;
});
