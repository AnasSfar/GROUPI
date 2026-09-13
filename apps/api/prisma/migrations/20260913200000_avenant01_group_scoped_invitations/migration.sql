-- Ch. A (extension) : un lien d'invitation peut désormais cibler directement un groupe standard
-- précis d'un Professeur (nouvel élève en cours d'année), en plus du lien général existant
-- (`groupId IS NULL`). Le triplet (teacherId, academicYearId) ne suffit donc plus à garantir
-- l'unicité à lui seul : on la remplace par deux index uniques PARTIELS, même schéma que
-- `group_level_pool_teacher_level_year_key` (migration avenant01).

-- DropIndex
DROP INDEX "parent_invitation_teacher_id_academic_year_id_key";

-- AlterTable
ALTER TABLE "parent_invitation" ADD COLUMN "group_id" UUID;

-- CreateIndex
-- Un seul lien GENERAL par (Professeur, année académique) : uniquement les lignes sans groupe ciblé.
CREATE UNIQUE INDEX "parent_invitation_teacher_year_general_key"
  ON "parent_invitation" ("teacher_id", "academic_year_id")
  WHERE "group_id" IS NULL;

-- CreateIndex
-- Un seul lien CIBLE par (Professeur, groupe) : uniquement les lignes avec un groupe ciblé.
CREATE UNIQUE INDEX "parent_invitation_teacher_group_key"
  ON "parent_invitation" ("teacher_id", "group_id")
  WHERE "group_id" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "parent_invitation" ADD CONSTRAINT "parent_invitation_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
