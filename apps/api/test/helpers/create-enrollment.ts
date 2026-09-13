import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Avenant 02 : toute inscription naît désormais directement `ACTIVE` (affectation Professeur ou
 * préinscription confirmée) — il n'existe plus d'endpoint de décision (`accept`/`reject`) à
 * appeler après coup. Les suites e2e qui ne testent pas elles-mêmes le chemin de création d'une
 * inscription (changement de groupe, présence, comptabilité, notifications...) ont simplement
 * besoin d'une inscription `ACTIVE` avec son compte de suivi comptable comme point de départ : ce
 * helper la crée directement en base, en reproduisant la même mécanique que
 * `EnrollmentsService.changeGroup`/`GroupMembersService.assignOne` (compte comptable créé à
 * l'activation, RM-CPT-002).
 */
export async function createActiveEnrollmentDirect(
  prisma: PrismaService,
  studentId: string,
  groupId: string,
): Promise<{ id: string; status: string }> {
  const group = await prisma.group.findUniqueOrThrow({ where: { id: groupId } });
  const enrollment = await prisma.enrollment.create({
    data: { studentId, groupId, status: 'ACTIVE', requestedAt: new Date(), decidedAt: new Date() },
    select: { id: true, status: true },
  });

  let period = await prisma.accountingPeriod.findUnique({ where: { academicYearId: group.academicYearId } });
  if (!period) {
    const year = await prisma.academicYear.findUniqueOrThrow({ where: { id: group.academicYearId } });
    period = await prisma.accountingPeriod.create({
      data: { academicYearId: group.academicYearId, openDate: year.startDate, closeDate: year.endDate, status: 'OPEN' },
    });
  }
  await prisma.accountingAccount.create({
    data: { enrollmentId: enrollment.id, periodId: period.id, status: 'CREATED' },
  });

  return enrollment;
}
