-- Campos trazidos pela importação de planilhas de produtos.
ALTER TABLE "catalog"."products"
  ADD COLUMN "sale_price" DECIMAL(19,4),
  ADD COLUMN "brand" TEXT,
  ADD CONSTRAINT "products_sale_price_non_negative" CHECK ("sale_price" IS NULL OR "sale_price" >= 0);
