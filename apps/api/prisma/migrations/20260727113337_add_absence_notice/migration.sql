-- CreateTable
CREATE TABLE "absence_notice" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "parent_id" UUID NOT NULL,
    "reason" TEXT,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "absence_notice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "absence_notice_session_id_student_id_key" ON "absence_notice"("session_id", "student_id");

-- AddForeignKey
ALTER TABLE "absence_notice" ADD CONSTRAINT "absence_notice_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absence_notice" ADD CONSTRAINT "absence_notice_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absence_notice" ADD CONSTRAINT "absence_notice_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absence_notice" ADD CONSTRAINT "absence_notice_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parent_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
