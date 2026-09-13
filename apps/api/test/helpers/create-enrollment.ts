import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Avenant 01, Ch. C/D.2, RM-PAR-021, ERR-PAR-023 : `POST /enrollments` (demande d'inscription à
 * l'initiative du Parent) est supprimé — remplacé par l'affectation Professeur (Ch. C, module
 * séparé, hors périmètre de ce chantier) ou par la transformation d'une préinscription confirmée
 * (Ch. 11, inchangée). Les suites e2e antérieures à l'avenant qui ne testent PAS ce chemin
 * elles-mêmes (décision du Professeur, changement de groupe, clôture automatique...) ont
 * simplement besoin d'une inscription `PENDING_VALIDATION` comme point de départ : ce helper la
 * crée directement en base plutôt que de dépendre d'un endpoint désormais retiré.
 */
export async function createPendingEnrollmentDirect(
  prisma: PrismaService,
  studentId: string,
  groupId: string,
): Promise<{ id: string; status: string }> {
  return prisma.enrollment.create({
    data: { studentId, groupId, status: 'PENDING_VALIDATION', requestedAt: new Date() },
    select: { id: true, status: true },
  });
}
