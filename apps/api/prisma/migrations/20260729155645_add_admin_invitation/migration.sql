-- AlterTable
ALTER TABLE "administrator" ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "scheduled_notification_marker" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "school_addition_request" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "admin_invitation_token" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_invitation_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_invitation_token_token_hash_key" ON "admin_invitation_token"("token_hash");

-- AddForeignKey
ALTER TABLE "admin_invitation_token" ADD CONSTRAINT "admin_invitation_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
