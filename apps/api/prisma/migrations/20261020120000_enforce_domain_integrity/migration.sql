-- PostgreSQL 15+. Fail atomically if existing data violates an invariant.
-- Do not silently delete duplicates or repair historical balances.
BEGIN;

-- DropForeignKey
ALTER TABLE "audit"."audit_logs" DROP CONSTRAINT "audit_logs_actor_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory"."stock_count_items" DROP CONSTRAINT "stock_count_items_stock_count_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory"."stock_count_items" DROP CONSTRAINT "stock_count_items_location_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory"."stock_count_items" DROP CONSTRAINT "stock_count_items_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory"."location_stocks" DROP CONSTRAINT "location_stocks_location_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory"."location_stocks" DROP CONSTRAINT "location_stocks_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory"."stock_movements" DROP CONSTRAINT "stock_movements_location_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory"."stock_movements" DROP CONSTRAINT "stock_movements_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory"."stock_reservations" DROP CONSTRAINT "stock_reservations_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory"."stock_transfer_items" DROP CONSTRAINT "stock_transfer_items_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "warehouse"."warehouse_locations" DROP CONSTRAINT "warehouse_locations_parent_id_fkey";

-- AlterTable
ALTER TABLE "audit"."audit_logs" ADD COLUMN     "actor_email" TEXT;

-- AlterTable
ALTER TABLE "inventory"."stock_count_items" ADD COLUMN "warehouse_id" UUID;
UPDATE "inventory"."stock_count_items" AS item
SET "warehouse_id" = count."warehouse_id"
FROM "inventory"."stock_counts" AS count WHERE count."id" = item."stock_count_id";
ALTER TABLE "inventory"."stock_count_items" ALTER COLUMN "warehouse_id" SET NOT NULL;

-- Backfill the best available actor snapshot before enabling append-only protection.
UPDATE "audit"."audit_logs" AS log SET "actor_email" = actor."email"
FROM "identity"."users" AS actor WHERE log."actor_id" = actor."id";

-- CreateIndex
CREATE UNIQUE INDEX "inventory_lots_id_product_id_key" ON "inventory"."inventory_lots"("id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_counts_id_warehouse_id_key" ON "inventory"."stock_counts"("id", "warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_locations_id_warehouse_id_key" ON "warehouse"."warehouse_locations"("id", "warehouse_id");

-- AddForeignKey
ALTER TABLE "inventory"."stock_count_items" ADD CONSTRAINT "stock_count_items_stock_count_id_warehouse_id_fkey" FOREIGN KEY ("stock_count_id", "warehouse_id") REFERENCES "inventory"."stock_counts"("id", "warehouse_id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "inventory"."stock_count_items" ADD CONSTRAINT "stock_count_items_location_id_warehouse_id_fkey" FOREIGN KEY ("location_id", "warehouse_id") REFERENCES "warehouse"."warehouse_locations"("id", "warehouse_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "inventory"."stock_count_items" ADD CONSTRAINT "stock_count_items_lot_id_product_id_fkey" FOREIGN KEY ("lot_id", "product_id") REFERENCES "inventory"."inventory_lots"("id", "product_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "inventory"."location_stocks" ADD CONSTRAINT "location_stocks_location_id_warehouse_id_fkey" FOREIGN KEY ("location_id", "warehouse_id") REFERENCES "warehouse"."warehouse_locations"("id", "warehouse_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "inventory"."location_stocks" ADD CONSTRAINT "location_stocks_lot_id_product_id_fkey" FOREIGN KEY ("lot_id", "product_id") REFERENCES "inventory"."inventory_lots"("id", "product_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "inventory"."stock_movements" ADD CONSTRAINT "stock_movements_location_id_warehouse_id_fkey" FOREIGN KEY ("location_id", "warehouse_id") REFERENCES "warehouse"."warehouse_locations"("id", "warehouse_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "inventory"."stock_movements" ADD CONSTRAINT "stock_movements_lot_id_product_id_fkey" FOREIGN KEY ("lot_id", "product_id") REFERENCES "inventory"."inventory_lots"("id", "product_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "inventory"."stock_reservations" ADD CONSTRAINT "stock_reservations_lot_id_product_id_fkey" FOREIGN KEY ("lot_id", "product_id") REFERENCES "inventory"."inventory_lots"("id", "product_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "inventory"."stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_lot_id_product_id_fkey" FOREIGN KEY ("lot_id", "product_id") REFERENCES "inventory"."inventory_lots"("id", "product_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "warehouse"."warehouse_locations" ADD CONSTRAINT "warehouse_locations_parent_id_warehouse_id_fkey" FOREIGN KEY ("parent_id", "warehouse_id") REFERENCES "warehouse"."warehouse_locations"("id", "warehouse_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Balance invariants apply to every writer, including imports and SQL clients.
ALTER TABLE "inventory"."stock_levels"
  ADD CONSTRAINT "stock_levels_balances_check" CHECK (quantity >= 0 AND reserved >= 0 AND reserved <= quantity AND incoming >= 0);
ALTER TABLE "inventory"."location_stocks"
  ADD CONSTRAINT "location_stocks_balances_check" CHECK (quantity >= 0 AND reserved >= 0 AND reserved <= quantity);
ALTER TABLE "inventory"."stock_reservations"
  ADD CONSTRAINT "stock_reservations_quantity_check" CHECK (quantity > 0);

DROP INDEX "inventory"."location_stocks_location_id_product_id_lot_id_key";
CREATE UNIQUE INDEX "location_stocks_location_id_product_id_lot_id_key" ON "inventory"."location_stocks" (location_id, product_id, lot_id) NULLS NOT DISTINCT;

DROP INDEX "inventory"."stock_transfer_items_transfer_id_product_id_lot_id_key";
CREATE UNIQUE INDEX "stock_transfer_items_transfer_id_product_id_lot_id_key" ON "inventory"."stock_transfer_items" (transfer_id, product_id, lot_id) NULLS NOT DISTINCT;

DROP INDEX "inventory"."stock_count_items_stock_count_id_product_id_location_id_lot_key";
CREATE UNIQUE INDEX "stock_count_items_stock_count_id_product_id_location_id_lot_key" ON "inventory"."stock_count_items" (stock_count_id, product_id, location_id, lot_id) NULLS NOT DISTINCT;

DROP INDEX "platform"."settings_scope_scope_id_key_key";
CREATE UNIQUE INDEX "settings_scope_scope_id_key_key" ON "platform"."settings" (scope, scope_id, key) NULLS NOT DISTINCT;

DROP INDEX "analytics"."demand_forecasts_run_id_product_id_warehouse_id_period_star_key";
CREATE UNIQUE INDEX "demand_forecasts_run_id_product_id_warehouse_id_period_star_key" ON "analytics"."demand_forecasts" (run_id, product_id, warehouse_id, period_start) NULLS NOT DISTINCT;

DROP INDEX "catalog"."categories_parent_id_slug_key";
CREATE UNIQUE INDEX "categories_parent_id_slug_key" ON "catalog"."categories" (parent_id, slug) NULLS NOT DISTINCT;

-- An acknowledged alert is still open. Resolved/suppressed alerts release the key.
CREATE UNIQUE INDEX "alerts_active_dedup_key" ON "analytics"."alerts" (dedup_key)
  WHERE status IN ('OPEN', 'ACKNOWLEDGED');

-- Defense in depth: runtime roles must not own these tables or be superusers.
REVOKE UPDATE, DELETE, TRUNCATE ON "audit"."audit_logs", "audit"."audit_log_changes" FROM PUBLIC;
CREATE FUNCTION "audit"."reject_history_mutation"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit history is append-only: % on %.% is forbidden', TG_OP, TG_TABLE_SCHEMA, TG_TABLE_NAME
    USING ERRCODE = '55000';
END;
$$;
CREATE TRIGGER "audit_logs_append_only"
  BEFORE UPDATE OR DELETE OR TRUNCATE ON "audit"."audit_logs"
  FOR EACH STATEMENT EXECUTE FUNCTION "audit"."reject_history_mutation"();
CREATE TRIGGER "audit_log_changes_append_only"
  BEFORE UPDATE OR DELETE OR TRUNCATE ON "audit"."audit_log_changes"
  FOR EACH STATEMENT EXECUTE FUNCTION "audit"."reject_history_mutation"();

COMMIT;
