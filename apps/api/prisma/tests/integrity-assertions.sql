SET search_path = integrity_test, public;
CREATE FUNCTION integrity_test.expect_failure(statement text, expected_state text, expected_constraint text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual_constraint text;
BEGIN
  BEGIN
    EXECUTE statement;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS actual_constraint = CONSTRAINT_NAME;
    IF SQLSTATE <> expected_state OR (expected_constraint IS NOT NULL AND actual_constraint <> expected_constraint) THEN
      RAISE EXCEPTION 'Wrong failure: SQLSTATE %, constraint %, expected % / %: %', SQLSTATE, actual_constraint, expected_state, expected_constraint, SQLERRM;
    END IF;
    RETURN;
  END;
  RAISE EXCEPTION 'Statement unexpectedly succeeded: %', statement;
END;
$$;

-- Backfills preserve existing rows.
DO $$ BEGIN
  IF (SELECT warehouse_id FROM inventory.stock_count_items WHERE id = id('count-item')) IS DISTINCT FROM id('warehouse1') THEN
    RAISE EXCEPTION 'Count warehouse was not backfilled';
  END IF;
  IF (SELECT actor_email FROM audit.audit_logs WHERE id = id('audit')) IS DISTINCT FROM 'original@example.test' THEN
    RAISE EXCEPTION 'Actor email was not backfilled';
  END IF;
END $$;

SELECT expect_failure('UPDATE inventory.stock_levels SET quantity = -1', '23514', 'stock_levels_balances_check');
SELECT expect_failure('UPDATE inventory.stock_levels SET reserved = -1', '23514', 'stock_levels_balances_check');
SELECT expect_failure('UPDATE inventory.stock_levels SET reserved = 11', '23514', 'stock_levels_balances_check');
SELECT expect_failure('UPDATE inventory.stock_levels SET incoming = -1', '23514', 'stock_levels_balances_check');
SELECT expect_failure('UPDATE inventory.location_stocks SET quantity = -1', '23514', 'location_stocks_balances_check');
SELECT expect_failure('UPDATE inventory.location_stocks SET reserved = -1', '23514', 'location_stocks_balances_check');
SELECT expect_failure('UPDATE inventory.location_stocks SET reserved = 11', '23514', 'location_stocks_balances_check');
SELECT expect_failure('UPDATE inventory.stock_reservations SET quantity = 0', '23514', 'stock_reservations_quantity_check');
SELECT expect_failure('UPDATE inventory.stock_reservations SET quantity = -1', '23514', 'stock_reservations_quantity_check');
UPDATE inventory.stock_levels SET reserved = quantity, incoming = 0;
UPDATE inventory.location_stocks SET reserved = quantity;

-- Every table carrying a lot must agree with its product.
DO $$ DECLARE target text; BEGIN
  FOREACH target IN ARRAY ARRAY['location_stocks', 'stock_movements', 'stock_reservations', 'stock_transfer_items', 'stock_count_items'] LOOP
    PERFORM expect_failure(format('UPDATE inventory.%I SET lot_id = id(''lot2'')', target), '23503', target || '_lot_id_product_id_fkey');
    EXECUTE format('UPDATE inventory.%I SET lot_id = id(''lot1'')', target);
    EXECUTE format('UPDATE inventory.%I SET lot_id = NULL', target);
  END LOOP;
END $$;
SELECT expect_failure('UPDATE inventory.location_stocks SET location_id = id(''location2'')', '23503', 'location_stocks_location_id_warehouse_id_fkey');
SELECT expect_failure('UPDATE inventory.stock_movements SET location_id = id(''location2'')', '23503', 'stock_movements_location_id_warehouse_id_fkey');
SELECT expect_failure('UPDATE inventory.stock_count_items SET location_id = id(''location2'')', '23503', 'stock_count_items_location_id_warehouse_id_fkey');
SELECT expect_failure('UPDATE inventory.stock_count_items SET warehouse_id = id(''warehouse2'')', '23503', 'stock_count_items_stock_count_id_warehouse_id_fkey');
SELECT expect_failure('UPDATE warehouse.warehouse_locations SET parent_id = id(''location2'') WHERE id = id(''location1'')', '23503', 'warehouse_locations_parent_id_warehouse_id_fkey');
UPDATE inventory.stock_count_items SET location_id = id('location1');
SELECT expect_failure('UPDATE warehouse.warehouse_locations SET warehouse_id = id(''warehouse2'') WHERE id = id(''location1'')', '23503');
UPDATE inventory.stock_count_items SET location_id = NULL;

-- A null dimension still identifies ONE business record.
SELECT expect_failure($q$INSERT INTO inventory.location_stocks (id, product_id, warehouse_id, location_id, updated_at)
VALUES (gen_random_uuid(), id('product1'), id('warehouse1'), id('location1'), now())$q$, '23505', 'location_stocks_location_id_product_id_lot_id_key');
SELECT expect_failure($q$INSERT INTO inventory.stock_transfer_items (id, transfer_id, product_id, requested_quantity, updated_at)
VALUES (gen_random_uuid(), id('transfer'), id('product1'), 1, now())$q$, '23505', 'stock_transfer_items_transfer_id_product_id_lot_id_key');
SELECT expect_failure($q$INSERT INTO inventory.stock_count_items (id, stock_count_id, warehouse_id, product_id, expected_quantity, updated_at)
VALUES (gen_random_uuid(), id('count'), id('warehouse1'), id('product1'), 1, now())$q$, '23505', 'stock_count_items_stock_count_id_product_id_location_id_lot_key');
SELECT expect_failure($q$INSERT INTO platform.settings (id, scope, key, value, updated_at)
VALUES (gen_random_uuid(), 'SYSTEM', 'example', '2', now())$q$, '23505', 'settings_scope_scope_id_key_key');
SELECT expect_failure($q$INSERT INTO analytics.demand_forecasts (id, run_id, product_id, granularity, period_start, predicted)
VALUES (gen_random_uuid(), id('forecast-run'), id('product1'), 'WEEKLY', '2026-10-20', 2)$q$, '23505', 'demand_forecasts_run_id_product_id_warehouse_id_period_star_key');
SELECT expect_failure($q$INSERT INTO catalog.categories (id, code, name, slug, path, updated_at)
VALUES (gen_random_uuid(), 'OTHER', 'Other', 'root', '/different', now())$q$, '23505', 'categories_parent_id_slug_key');
-- Different dimensions remain valid.
INSERT INTO inventory.location_stocks (id, product_id, warehouse_id, location_id, lot_id, updated_at)
VALUES (gen_random_uuid(), id('product1'), id('warehouse1'), id('location1'), id('lot1'), now());
INSERT INTO platform.settings (id, scope, scope_id, key, value, updated_at)
VALUES (gen_random_uuid(), 'WAREHOUSE', id('warehouse1'), 'example', '2', now());

-- Acknowledged alerts hold the key; resolved/suppressed alerts release it.
SELECT expect_failure($q$INSERT INTO analytics.alerts (id, type, severity, dedup_key, title, message)
VALUES (gen_random_uuid(), 'LOW_STOCK', 'WARNING', 'low-stock:example', 'Duplicate', 'Duplicate')$q$, '23505', 'alerts_active_dedup_key');
UPDATE analytics.alerts SET status = 'ACKNOWLEDGED' WHERE id = id('alert');
SELECT expect_failure($q$INSERT INTO analytics.alerts (id, type, severity, dedup_key, title, message)
VALUES (gen_random_uuid(), 'LOW_STOCK', 'WARNING', 'low-stock:example', 'Duplicate', 'Duplicate')$q$, '23505', 'alerts_active_dedup_key');
UPDATE analytics.alerts SET status = 'RESOLVED' WHERE id = id('alert');
INSERT INTO analytics.alerts (id, type, severity, dedup_key, title, message)
VALUES (id('alert2'), 'LOW_STOCK', 'WARNING', 'low-stock:example', 'New occurrence', 'Example');
SELECT expect_failure('UPDATE analytics.alerts SET status = ''OPEN'' WHERE id = id(''alert'')', '23505', 'alerts_active_dedup_key');
UPDATE analytics.alerts SET status = 'SUPPRESSED' WHERE id = id('alert2');
UPDATE analytics.alerts SET status = 'OPEN' WHERE id = id('alert');

-- Audit writes are immutable, including SQL TRUNCATE and modifications to changes.
DO $$ DECLARE target text; BEGIN
  FOREACH target IN ARRAY ARRAY['audit_logs', 'audit_log_changes'] LOOP
    PERFORM expect_failure(format('UPDATE audit.%I SET id = id', target), '55000');
    PERFORM expect_failure(format('DELETE FROM audit.%I', target), '55000');
    PERFORM expect_failure(format('TRUNCATE audit.%I CASCADE', target), '55000');
  END LOOP;
END $$;
-- Event retries do not update the original payload or snapshot.
INSERT INTO audit.audit_logs (id, event_id, event_name, occurred_at, entity_type, entity_id, action, payload)
VALUES (gen_random_uuid(), 'event1', 'Wrong', now(), 'Wrong', 'wrong', 'UPDATE', '{"changed":true}')
ON CONFLICT DO NOTHING;
UPDATE identity.users SET email = 'changed@example.test' WHERE id = id('actor');
-- The actor used only by audit can be deleted; movements retain their existing FK policy.
INSERT INTO identity.users (id, email, name, password_hash, updated_at)
VALUES (id('deleted-actor'), 'deleted@example.test', 'Deleted actor', 'unused', now());
INSERT INTO audit.audit_logs (id, event_id, event_name, occurred_at, actor_id, actor_email, entity_type, entity_id, action, payload)
VALUES (id('deleted-actor-audit'), 'event2', 'Example.Created', now(), id('deleted-actor'), 'deleted@example.test', 'Example', 'example', 'CREATE', '{}');
DELETE FROM identity.users WHERE id = id('deleted-actor');
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM audit.audit_logs WHERE id = id('audit') AND actor_email = 'original@example.test' AND payload = '{}'::jsonb) THEN
    RAISE EXCEPTION 'Retry or user edit mutated audit history';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM audit.audit_logs WHERE id = id('deleted-actor-audit') AND actor_id = id('deleted-actor') AND actor_email = 'deleted@example.test') THEN
    RAISE EXCEPTION 'Deleting the actor mutated audit history';
  END IF;
END $$;
