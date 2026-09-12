-- CreateEnum
CREATE TYPE "GroupKind" AS ENUM ('LEVEL_POOL', 'STANDARD');

-- CreateEnum
CREATE TYPE "EnrollmentOrigin" AS ENUM ('TEACHER_ASSIGNMENT', 'PRE_ENROLLMENT', 'GROUP_CHANGE');

-- CreateEnum
CREATE TYPE "ParentInvitationStatus" AS ENUM ('ACTIVE', 'DISABLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LevelPoolMembershipStatus" AS ENUM ('ACTIVE', 'REMOVED');

-- CreateEnum
CREATE TYPE "MembershipSource" AS ENUM ('INVITATION', 'TEACHER_MANUAL', 'SITUATION_SYNC');

-- DropForeignKey
ALTER TABLE "group" DROP CONSTRAINT "group_subject_id_fkey";

-- DropIndex
DROP INDEX "user_email_key";

-- AlterTable
ALTER TABLE "enrollment" ADD COLUMN     "origin" "EnrollmentOrigin" NOT NULL DEFAULT 'TEACHER_ASSIGNMENT',
ADD COLUMN     "source_membership_id" UUID;

-- AlterTable
ALTER TABLE "group" ADD COLUMN     "kind" "GroupKind" NOT NULL DEFAULT 'STANDARD',
ALTER COLUMN "subject_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "parent_invitation" (
    "id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "status" "ParentInvitationStatus" NOT NULL,
    "expires_at" TIMESTAMP(3),
    "rotated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_pool_membership" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "status" "LevelPoolMembershipStatus" NOT NULL,
    "source" "MembershipSource" NOT NULL,
    "invitation_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removed_at" TIMESTAMP(3),
    "removed_by_id" UUID,

    CONSTRAINT "level_pool_membership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parent_invitation_token_hash_key" ON "parent_invitation"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "parent_invitation_teacher_id_academic_year_id_key" ON "parent_invitation"("teacher_id", "academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "level_pool_membership_student_id_group_id_key" ON "level_pool_membership"("student_id", "group_id");

-- Avenant 01, Ch. B.3/B.6 (RM-POOL-001) : au plus un groupe de niveau par (Professeur, niveau,
-- année académique). Index PARTIEL (uniquement les lignes kind = 'LEVEL_POOL') car des groupes
-- STANDARD partagent librement le même triplet teacher/niveau/année (ex. 7G1 et 7G2) — non
-- exprimable via un `@@unique` Prisma classique, d'où cet ajout manuel.
CREATE UNIQUE INDEX "group_level_pool_teacher_level_year_key"
  ON "group" ("teacher_id", "school_level_id", "academic_year_id")
  WHERE "kind" = 'LEVEL_POOL';

-- AddForeignKey
ALTER TABLE "group" ADD CONSTRAINT "group_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_source_membership_id_fkey" FOREIGN KEY ("source_membership_id") REFERENCES "level_pool_membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_invitation" ADD CONSTRAINT "parent_invitation_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_invitation" ADD CONSTRAINT "parent_invitation_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_year"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_pool_membership" ADD CONSTRAINT "level_pool_membership_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_pool_membership" ADD CONSTRAINT "level_pool_membership_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_pool_membership" ADD CONSTRAINT "level_pool_membership_invitation_id_fkey" FOREIGN KEY ("invitation_id") REFERENCES "parent_invitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_pool_membership" ADD CONSTRAINT "level_pool_membership_removed_by_id_fkey" FOREIGN KEY ("removed_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
