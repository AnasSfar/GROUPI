-- AlterEnum
-- Ch.11.14/PRE-STAT-006/007 : ajoute les états CANCELLED (annulée par le Parent avant
-- proposition, RM-PRE-020) et CLOSED (clôturée sans transformation, RM-PRE-028) au cycle
-- de vie des préinscriptions. Migration purement additive.
ALTER TYPE "PreEnrollmentStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "PreEnrollmentStatus" ADD VALUE 'CLOSED';

-- AlterTable
-- Ch.11.7/11.8 : mémorise le groupe auquel une proposition a été envoyée, pour pouvoir
-- revérifier sa capacité disponible au moment de la confirmation par le Parent (RM-PRE-021/022).
ALTER TABLE "pre_enrollment" ADD COLUMN     "proposed_group_id" UUID;

-- AddForeignKey
ALTER TABLE "pre_enrollment" ADD CONSTRAINT "pre_enrollment_proposed_group_id_fkey" FOREIGN KEY ("proposed_group_id") REFERENCES "group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
