-- The official GPS referential contains duplicate establishment names, so
-- School is now identified for seed/upsert purposes by a stable source key.
DROP INDEX IF EXISTS "school_name_key";

ALTER TABLE "school"
  ADD COLUMN "source_key" TEXT,
  ADD COLUMN "official_code" TEXT,
  ADD COLUMN "auto_code" TEXT,
  ADD COLUMN "name_ar" TEXT,
  ADD COLUMN "regional_directorate" TEXT,
  ADD COLUMN "regional_directorate_ar" TEXT,
  ADD COLUMN "delegation" TEXT,
  ADD COLUMN "delegation_ar" TEXT,
  ADD COLUMN "region_ar" TEXT,
  ADD COLUMN "cycle_ar" TEXT;

CREATE UNIQUE INDEX "school_source_key_key" ON "school"("source_key");
