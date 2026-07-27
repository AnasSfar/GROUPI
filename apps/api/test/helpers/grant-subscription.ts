import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Ch.22 : depuis `SubscriptionGuard`, toute opération de création/modification d'un Professeur
 * exige un abonnement exploitable pour une année académique OPEN. Les suites e2e antérieures au
 * Ch.22 n'en créaient pas — ce helper leur donne un abonnement Pro actif (capacité illimitée, sans
 * incidence sur les scénarios testés) pour l'année académique OPEN qu'elles utilisent déjà.
 */
export async function grantActiveSubscription(
  prisma: PrismaService,
  teacherId: string,
  academicYearId: string,
): Promise<void> {
  const proPlan = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { code: 'PRO' } });
  const academicYear = await prisma.academicYear.findUniqueOrThrow({ where: { id: academicYearId } });
  const now = new Date();
  await prisma.subscription.upsert({
    where: { teacherId_academicYearId: { teacherId, academicYearId } },
    update: { status: 'ACTIVE', activatedAt: now, expiresAt: academicYear.endDate },
    create: {
      teacherId,
      planId: proPlan.id,
      academicYearId,
      status: 'ACTIVE',
      requestedAt: now,
      activatedAt: now,
      expiresAt: academicYear.endDate,
    },
  });
}
