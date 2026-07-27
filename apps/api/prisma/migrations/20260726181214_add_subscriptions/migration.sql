-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'SUSPENDED', 'EXPIRED');

-- CreateTable
CREATE TABLE "subscription_plan" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "max_active_enrollments" INTEGER,
    "duration_days" INTEGER,
    "is_trial" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription" (
    "id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL,
    "activated_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "payment_method" TEXT,
    "validated_by_id" UUID,
    "suspended_at" TIMESTAMP(3),
    "suspended_by_id" UUID,
    "suspension_reason" TEXT,
    "reactivated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_code_key" ON "subscription_plan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_teacher_id_academic_year_id_key" ON "subscription"("teacher_id", "academic_year_id");

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_year"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_validated_by_id_fkey" FOREIGN KEY ("validated_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_suspended_by_id_fkey" FOREIGN KEY ("suspended_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
