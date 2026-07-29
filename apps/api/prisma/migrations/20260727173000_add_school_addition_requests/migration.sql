CREATE TABLE "school_addition_request" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "parent_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SchoolType" NOT NULL,
    "city_id" UUID NOT NULL,
    "address" TEXT,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_school_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_addition_request_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "school_addition_request_status_created_at_idx" ON "school_addition_request"("status", "created_at");

ALTER TABLE "school_addition_request" ADD CONSTRAINT "school_addition_request_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parent_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "school_addition_request" ADD CONSTRAINT "school_addition_request_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "city"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "school_addition_request" ADD CONSTRAINT "school_addition_request_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "school_addition_request" ADD CONSTRAINT "school_addition_request_created_school_id_fkey" FOREIGN KEY ("created_school_id") REFERENCES "school"("id") ON DELETE SET NULL ON UPDATE CASCADE;