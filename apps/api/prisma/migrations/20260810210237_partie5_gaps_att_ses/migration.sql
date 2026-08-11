-- AlterEnum
ALTER TYPE "AttendanceStatus" ADD VALUE 'NOT_SET';

-- AlterTable
ALTER TABLE "city" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "school" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "school_level" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "session" ADD COLUMN     "unlock_override_until" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "subject" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "subject_level" ALTER COLUMN "updated_at" DROP DEFAULT;

