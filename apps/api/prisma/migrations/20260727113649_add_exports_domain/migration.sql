-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('PDF', 'EXCEL', 'CSV');

-- CreateEnum
CREATE TYPE "ExportType" AS ENUM ('GROUPS', 'STUDENTS', 'ATTENDANCE', 'LATENESS', 'PEDAGOGICAL_COMMENTS', 'ACCOUNTING_ACCOUNTS', 'PAYMENTS', 'STATISTICS', 'DASHBOARD_INDICATORS', 'ADMIN_STATISTICS', 'RGPD_PERSONAL_DATA');

-- CreateEnum
CREATE TYPE "ExportJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DataPortabilityRequestStatus" AS ENUM ('PENDING', 'FULFILLED');

-- CreateTable
CREATE TABLE "export_job" (
    "id" UUID NOT NULL,
    "requested_by_id" UUID NOT NULL,
    "generated_by_id" UUID,
    "type" "ExportType" NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "status" "ExportJobStatus" NOT NULL DEFAULT 'PENDING',
    "criteria" JSONB,
    "file_name" TEXT,
    "file_bytes" BYTEA,
    "file_size" INTEGER,
    "row_count" INTEGER,
    "is_async" BOOLEAN NOT NULL DEFAULT false,
    "error_message" TEXT,
    "downloaded_at" TIMESTAMP(3),
    "ready_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "export_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_audit" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "ExportType" NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "criteria" JSONB,
    "outcome" TEXT NOT NULL,
    "refusal_reason" TEXT,
    "export_job_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "export_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_portability_request" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "DataPortabilityRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL,
    "due_at" TIMESTAMP(3) NOT NULL,
    "fulfilled_at" TIMESTAMP(3),
    "fulfilled_by_id" UUID,
    "export_job_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_portability_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "export_job_requested_by_id_created_at_idx" ON "export_job"("requested_by_id", "created_at");

-- CreateIndex
CREATE INDEX "export_audit_user_id_created_at_idx" ON "export_audit"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "data_portability_request_export_job_id_key" ON "data_portability_request"("export_job_id");

-- AddForeignKey
ALTER TABLE "export_job" ADD CONSTRAINT "export_job_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_job" ADD CONSTRAINT "export_job_generated_by_id_fkey" FOREIGN KEY ("generated_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_audit" ADD CONSTRAINT "export_audit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_audit" ADD CONSTRAINT "export_audit_export_job_id_fkey" FOREIGN KEY ("export_job_id") REFERENCES "export_job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_portability_request" ADD CONSTRAINT "data_portability_request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_portability_request" ADD CONSTRAINT "data_portability_request_fulfilled_by_id_fkey" FOREIGN KEY ("fulfilled_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_portability_request" ADD CONSTRAINT "data_portability_request_export_job_id_fkey" FOREIGN KEY ("export_job_id") REFERENCES "export_job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

