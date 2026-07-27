-- CreateEnum
CREATE TYPE "GroupChangeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "group_change_request" (
    "id" UUID NOT NULL,
    "original_enrollment_id" UUID NOT NULL,
    "target_group_id" UUID NOT NULL,
    "status" "GroupChangeStatus" NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL,
    "decided_at" TIMESTAMP(3),
    "decided_by_id" UUID,
    "effective_date" DATE,
    "applied_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "new_enrollment_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_change_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_change_request_new_enrollment_id_key" ON "group_change_request"("new_enrollment_id");

-- AddForeignKey
ALTER TABLE "group_change_request" ADD CONSTRAINT "group_change_request_original_enrollment_id_fkey" FOREIGN KEY ("original_enrollment_id") REFERENCES "enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_change_request" ADD CONSTRAINT "group_change_request_target_group_id_fkey" FOREIGN KEY ("target_group_id") REFERENCES "group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_change_request" ADD CONSTRAINT "group_change_request_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_change_request" ADD CONSTRAINT "group_change_request_new_enrollment_id_fkey" FOREIGN KEY ("new_enrollment_id") REFERENCES "enrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

