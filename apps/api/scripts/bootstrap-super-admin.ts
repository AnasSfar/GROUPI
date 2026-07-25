/**
 * One-shot script: creates the Super Administrator account if none exists yet.
 * Ch.8.5 : "Le compte Super Administrateur est créé dans l'application donc n'a pas de validation."
 * Idempotent — safe to re-run.
 *
 * Deliberately does not boot the NestJS app (tsx/esbuild doesn't reliably support
 * emitDecoratorMetadata, which breaks Nest's constructor-injection DI) — uses
 * @prisma/client and argon2 directly instead, same pattern as prisma/seed.ts.
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

async function main() {
  const prisma = new PrismaClient();

  const email = process.env.SUPER_ADMIN_EMAIL ?? 'admin@groupi.local';
  const plainPassword = process.env.SUPER_ADMIN_PASSWORD ?? 'ChangeMe123!';

  const existing = await prisma.user.findFirst({ where: { roles: { has: 'SUPER_ADMIN' } } });
  if (existing) {
    console.log(`Super Administrateur déjà présent (${existing.email}) — rien à faire.`);
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await argon2.hash(plainPassword, { type: argon2.argon2id });
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      status: 'ACTIVE',
      roles: ['SUPER_ADMIN'],
    },
  });

  console.log(`Super Administrateur créé : ${user.email} (id: ${user.id})`);
  if (!process.env.SUPER_ADMIN_PASSWORD) {
    console.log(`Mot de passe de dev par défaut : ${plainPassword} (change-le via SUPER_ADMIN_PASSWORD)`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Échec du bootstrap du Super Administrateur :', err);
  process.exitCode = 1;
});
