-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "enrollment_id" UUID NOT NULL,
ADD COLUMN     "recorded_by_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "attendance_history" (
    "id" UUID NOT NULL,
    "attendance_id" UUID NOT NULL,
    "previous_status" "AttendanceStatus",
    "previous_late_duration" INTEGER,
    "new_status" "AttendanceStatus" NOT NULL,
    "new_late_duration" INTEGER,
    "reason" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'WEB',
    "changed_by_id" UUID NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_session_id_student_id_key" ON "attendance"("session_id", "student_id");

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_history" ADD CONSTRAINT "attendance_history_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "attendance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_history" ADD CONSTRAINT "attendance_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

