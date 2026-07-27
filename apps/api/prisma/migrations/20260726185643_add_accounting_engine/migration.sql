-- CreateEnum
CREATE TYPE "AccountingAccountStatus" AS ENUM ('CREATED', 'ACTIVE', 'LOCKED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AccountingEntryStatus" AS ENUM ('CREATED', 'POSTED', 'REVERSED', 'LOCKED');

-- CreateEnum
CREATE TYPE "AccountingEntryType" AS ENUM ('PAYMENT', 'SESSION', 'ADJUSTMENT', 'ADMIN_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "AccountingEntryDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "AccountingPeriodStatus" AS ENUM ('OPEN', 'LOCKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AdjustmentReason" AS ENUM ('DATA_ENTRY_ERROR', 'ATTENDANCE_CORRECTION', 'EXCEPTIONAL_DISCOUNT', 'ADMIN_CORRECTION');

-- AlterTable
ALTER TABLE "group" ADD COLUMN     "debt_alert_threshold_sessions" INTEGER NOT NULL DEFAULT 4;

-- CreateTable
CREATE TABLE "accounting_period" (
    "id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "open_date" DATE NOT NULL,
    "close_date" DATE NOT NULL,
    "status" "AccountingPeriodStatus" NOT NULL DEFAULT 'OPEN',
    "locked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounting_period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_account" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "status" "AccountingAccountStatus" NOT NULL DEFAULT 'CREATED',
    "locked_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_entry" (
    "id" UUID NOT NULL,
    "entry_number" TEXT NOT NULL,
    "account_id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "type" "AccountingEntryType" NOT NULL,
    "direction" "AccountingEntryDirection" NOT NULL,
    "status" "AccountingEntryStatus" NOT NULL DEFAULT 'POSTED',
    "amount" DECIMAL(10,3) NOT NULL,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "session_id" UUID,
    "reason" "AdjustmentReason",
    "reason_note" TEXT,
    "payment_method" TEXT,
    "reverses_entry_id" UUID,
    "author_id" UUID NOT NULL,
    "locked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounting_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_entry_sequence" (
    "year" INTEGER NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "accounting_entry_sequence_pkey" PRIMARY KEY ("year")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounting_period_academic_year_id_key" ON "accounting_period"("academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_account_enrollment_id_key" ON "accounting_account"("enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_entry_entry_number_key" ON "accounting_entry"("entry_number");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_entry_reverses_entry_id_key" ON "accounting_entry"("reverses_entry_id");

-- CreateIndex
CREATE INDEX "accounting_entry_account_id_effective_date_idx" ON "accounting_entry"("account_id", "effective_date");

-- CreateIndex
CREATE INDEX "accounting_entry_account_id_session_id_idx" ON "accounting_entry"("account_id", "session_id");

-- AddForeignKey
ALTER TABLE "accounting_period" ADD CONSTRAINT "accounting_period_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_year"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_account" ADD CONSTRAINT "accounting_account_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_account" ADD CONSTRAINT "accounting_account_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "accounting_period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entry" ADD CONSTRAINT "accounting_entry_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounting_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entry" ADD CONSTRAINT "accounting_entry_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "accounting_period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entry" ADD CONSTRAINT "accounting_entry_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entry" ADD CONSTRAINT "accounting_entry_reverses_entry_id_fkey" FOREIGN KEY ("reverses_entry_id") REFERENCES "accounting_entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entry" ADD CONSTRAINT "accounting_entry_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
