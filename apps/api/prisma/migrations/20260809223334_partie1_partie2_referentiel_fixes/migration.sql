-- AlterTable
ALTER TABLE "teacher_profile" ADD COLUMN     "availability" TEXT;

-- AlterTable
ALTER TABLE "teacher_school_level" ADD COLUMN     "is_validated" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "teacher_subject" ADD COLUMN     "is_validated" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "user_device" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diploma" (
    "id" UUID NOT NULL,
    "teacher_profile_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diploma_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_device_user_id_ip_address_user_agent_key" ON "user_device"("user_id", "ip_address", "user_agent");

-- AddForeignKey
ALTER TABLE "user_device" ADD CONSTRAINT "user_device_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diploma" ADD CONSTRAINT "diploma_teacher_profile_id_fkey" FOREIGN KEY ("teacher_profile_id") REFERENCES "teacher_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
