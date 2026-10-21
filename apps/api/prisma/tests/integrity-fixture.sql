-- Applied BEFORE the integrity migration to exercise backfills with existing data.
CREATE SCHEMA integrity_test;
CREATE FUNCTION integrity_test.id(text) RETURNS uuid LANGUAGE sql IMMUTABLE AS 'SELECT md5($1)::uuid';
SET search_path = integrity_test, public;
INSERT INTO identity.users (id, email, name, password_hash, updated_at)
VALUES (id('actor'), 'original@example.test', 'Actor', 'unused', now());
INSERT INTO catalog.products (id, sku, name, updated_at)
SELECT id(key), key, key, now() FROM (VALUES ('product1'), ('product2')) AS v(key);
INSERT INTO warehouse.warehouses (id, code, name, updated_at)
SELECT id(key), key, key, now() FROM (VALUES ('warehouse1'), ('warehouse2')) AS v(key);
INSERT INTO warehouse.warehouse_locations (id, warehouse_id, code, path, type, updated_at)
SELECT id('location' || n), id('warehouse' || n), 'BIN' || n, 'BIN' || n, 'BIN', now() FROM generate_series(1, 2) AS n;
INSERT INTO inventory.inventory_lots (id, product_id, lot_number, updated_at)
SELECT id('lot' || n), id('product' || n), 'LOT', now() FROM generate_series(1, 2) AS n;
INSERT INTO inventory.stock_levels (id, product_id, warehouse_id, quantity, reserved, updated_at)
VALUES (id('stock'), id('product1'), id('warehouse1'), 10, 2, now());
INSERT INTO inventory.location_stocks (id, product_id, warehouse_id, location_id, quantity, reserved, updated_at)
VALUES (id('location-stock'), id('product1'), id('warehouse1'), id('location1'), 10, 2, now());
INSERT INTO inventory.stock_reservations (id, product_id, warehouse_id, quantity, updated_at)
VALUES (id('reservation'), id('product1'), id('warehouse1'), 2, now());
INSERT INTO inventory.stock_counts (id, code, warehouse_id, created_by, updated_at)
VALUES (id('count'), 'COUNT', id('warehouse1'), id('actor'), now());
INSERT INTO inventory.stock_count_items (id, stock_count_id, product_id, expected_quantity, updated_at)
VALUES (id('count-item'), id('count'), id('product1'), 10, now());
INSERT INTO inventory.stock_transfers (id, code, source_warehouse_id, destination_warehouse_id, requested_by, updated_at)
VALUES (id('transfer'), 'TRANSFER', id('warehouse1'), id('warehouse2'), id('actor'), now());
INSERT INTO inventory.stock_transfer_items (id, transfer_id, product_id, requested_quantity, updated_at)
VALUES (id('transfer-item'), id('transfer'), id('product1'), 2, now());
INSERT INTO inventory.stock_movements (id, product_id, warehouse_id, type, quantity, previous_qty, resulting_qty, performed_by)
VALUES (id('movement'), id('product1'), id('warehouse1'), 'INBOUND', 10, 0, 10, id('actor'));
INSERT INTO platform.settings (id, scope, key, value, updated_at)
VALUES (id('setting'), 'SYSTEM', 'example', '1', now());
INSERT INTO analytics.forecast_runs (id, model_name, model_version, horizon)
VALUES (id('forecast-run'), 'example', '1', 1);
INSERT INTO analytics.demand_forecasts (id, run_id, product_id, granularity, period_start, predicted)
VALUES (id('forecast'), id('forecast-run'), id('product1'), 'WEEKLY', '2026-10-20', 1);
INSERT INTO catalog.categories (id, code, name, slug, path, updated_at)
VALUES (id('category'), 'ROOT', 'Root', 'root', '/root', now());
INSERT INTO analytics.alerts (id, type, severity, dedup_key, title, message)
VALUES (id('alert'), 'LOW_STOCK', 'WARNING', 'low-stock:example', 'Low stock', 'Example');
INSERT INTO audit.audit_logs (id, event_id, event_name, occurred_at, actor_id, entity_type, entity_id, action, payload)
VALUES (id('audit'), 'event1', 'Example.Created', now(), id('actor'), 'Example', 'example', 'CREATE', '{}');
INSERT INTO audit.audit_log_changes (id, audit_log_id, field, new_value)
VALUES (id('audit-change'), id('audit'), 'name', '"example"');
