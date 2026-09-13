-- AlterEnum
BEGIN;
CREATE TYPE "EnrollmentStatus_new" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');
ALTER TABLE "enrollment" ALTER COLUMN "status" TYPE "EnrollmentStatus_new" USING ("status"::text::"EnrollmentStatus_new");
ALTER TYPE "EnrollmentStatus" RENAME TO "EnrollmentStatus_old";
ALTER TYPE "EnrollmentStatus_new" RENAME TO "EnrollmentStatus";
DROP TYPE "EnrollmentStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "group_change_request" DROP CONSTRAINT "group_change_request_decided_by_id_fkey";

-- DropForeignKey
ALTER TABLE "group_change_request" DROP CONSTRAINT "group_change_request_new_enrollment_id_fkey";

-- DropForeignKey
ALTER TABLE "group_change_request" DROP CONSTRAINT "group_change_request_original_enrollment_id_fkey";

-- DropForeignKey
ALTER TABLE "group_change_request" DROP CONSTRAINT "group_change_request_target_group_id_fkey";

-- DropTable
DROP TABLE "group_change_request";

-- DropEnum
DROP TYPE "GroupChangeStatus";

