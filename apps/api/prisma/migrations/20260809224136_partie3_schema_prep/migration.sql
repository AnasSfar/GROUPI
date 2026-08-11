-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "online_duration_minutes" INTEGER;

-- AlterTable
ALTER TABLE "group" ADD COLUMN     "generation_paused_from" DATE,
ADD COLUMN     "generation_paused_until" DATE,
ADD COLUMN     "lateness_alert_threshold" INTEGER,
ADD COLUMN     "pre_enrollments_open" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "group_schedule" ADD COLUMN     "teaching_mode" "TeachingMode";

-- AlterTable
ALTER TABLE "session" ADD COLUMN     "rescheduled_from_session_id" UUID,
ADD COLUMN     "teacher_comment" TEXT,
ADD COLUMN     "teaching_mode_exception" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "session_rescheduled_from_session_id_key" ON "session"("rescheduled_from_session_id");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_rescheduled_from_session_id_fkey" FOREIGN KEY ("rescheduled_from_session_id") REFERENCES "session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

