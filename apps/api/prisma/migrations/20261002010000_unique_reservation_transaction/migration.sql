CREATE UNIQUE INDEX "stock_reservations_transaction_id_key" ON "stock_reservations"("transaction_id");
DROP INDEX IF EXISTS "stock_reservations_transaction_id_idx";
