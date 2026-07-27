-- CreateEnum
CREATE TYPE "ActivityPriority" AS ENUM ('INFORMATION', 'IMPORTANT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CommentAuthorRole" AS ENUM ('TEACHER', 'PARENT');

-- CreateTable
CREATE TABLE "activity" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "priority" "ActivityPriority" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "ref_type" TEXT,
    "ref_id" UUID,
    "read_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "email_sent_at" TIMESTAMP(3),
    "email_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_comment" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "author_role" "CommentAuthorRole" NOT NULL,
    "body" TEXT NOT NULL,
    "edited_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollment_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_announcement" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "publish_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_announcement_read" (
    "announcement_id" UUID NOT NULL,
    "parent_id" UUID NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_announcement_read_pkey" PRIMARY KEY ("announcement_id","parent_id")
);

-- CreateIndex
CREATE INDEX "activity_user_id_created_at_idx" ON "activity"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_user_id_read_at_idx" ON "activity"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "enrollment_comment_enrollment_id_created_at_idx" ON "enrollment_comment"("enrollment_id", "created_at");

-- CreateIndex
CREATE INDEX "group_announcement_group_id_publish_at_idx" ON "group_announcement"("group_id", "publish_at");

-- AddForeignKey
ALTER TABLE "activity" ADD CONSTRAINT "activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_comment" ADD CONSTRAINT "enrollment_comment_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_comment" ADD CONSTRAINT "enrollment_comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_announcement" ADD CONSTRAINT "group_announcement_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_announcement" ADD CONSTRAINT "group_announcement_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_announcement_read" ADD CONSTRAINT "group_announcement_read_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "group_announcement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_announcement_read" ADD CONSTRAINT "group_announcement_read_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parent_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
