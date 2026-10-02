CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL,
  "event_id" TEXT NOT NULL,
  "event_name" TEXT NOT NULL,
  "occurred_at" TIMESTAMP(3) NOT NULL,
  "actor_id" UUID,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "correlation_id" TEXT,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "audit_logs_event_id_key" ON "audit_logs"("event_id");
CREATE INDEX "audit_logs_event_name_occurred_at_idx" ON "audit_logs"("event_name", "occurred_at");
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");
CREATE INDEX "audit_logs_actor_id_occurred_at_idx" ON "audit_logs"("actor_id", "occurred_at");
CREATE INDEX "audit_logs_occurred_at_idx" ON "audit_logs"("occurred_at");

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
