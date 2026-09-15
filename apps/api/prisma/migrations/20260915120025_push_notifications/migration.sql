-- CreateTable
CREATE TABLE "push_token" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preference" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lead_minutes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_token_token_key" ON "push_token"("token");

-- CreateIndex
CREATE INDEX "push_token_user_id_idx" ON "push_token"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preference_user_id_category_key" ON "notification_preference"("user_id", "category");

-- AddForeignKey
ALTER TABLE "push_token" ADD CONSTRAINT "push_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
