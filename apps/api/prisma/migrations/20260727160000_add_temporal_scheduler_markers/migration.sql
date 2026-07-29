CREATE TABLE "scheduled_notification_marker" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ref_type" TEXT,
    "ref_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_notification_marker_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "scheduled_notification_marker_key_key" ON "scheduled_notification_marker"("key");
CREATE INDEX "scheduled_notification_marker_type_created_at_idx" ON "scheduled_notification_marker"("type", "created_at");
