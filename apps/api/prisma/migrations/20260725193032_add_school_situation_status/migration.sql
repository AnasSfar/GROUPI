-- CreateEnum
CREATE TYPE "SituationStatus" AS ENUM ('ACTIVE', 'PENDING_VALIDATION', 'CLOSED', 'REJECTED');

-- AlterTable
ALTER TABLE "student_school_situation" ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "status" "SituationStatus" NOT NULL DEFAULT 'ACTIVE';
