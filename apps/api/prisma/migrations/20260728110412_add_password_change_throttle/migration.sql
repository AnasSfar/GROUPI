-- AlterTable
ALTER TABLE "user" ADD COLUMN     "password_change_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "password_change_window_start" TIMESTAMP(3);
