CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE "PermissionAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT');
CREATE TYPE "MovementType" AS ENUM ('INBOUND', 'OUTBOUND', 'TRANSFER', 'ADJUSTMENT', 'RESERVATION', 'RELEASE', 'RETURN');
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'COMMITTED', 'RELEASED', 'EXPIRED');

CREATE TABLE "users" (
  "id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "roles" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "is_system" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "permissions" (
  "id" UUID NOT NULL,
  "resource" TEXT NOT NULL,
  "action" "PermissionAction" NOT NULL,
  CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "user_roles" (
  "user_id" UUID NOT NULL,
  "role_id" UUID NOT NULL,
  "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "granted_by" UUID,
  CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id")
);
CREATE TABLE "role_permissions" (
  "role_id" UUID NOT NULL,
  "permission_id" UUID NOT NULL,
  CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id")
);
CREATE TABLE "warehouses" (
  "id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "address" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "products" (
  "id" UUID NOT NULL,
  "sku" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "unit" TEXT NOT NULL DEFAULT 'un',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "min_stock" DECIMAL(12,4) NOT NULL DEFAULT 0,
  "max_stock" DECIMAL(12,4),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "stock_levels" (
  "id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "warehouse_id" UUID NOT NULL,
  "quantity" DECIMAL(12,4) NOT NULL DEFAULT 0,
  "reserved" DECIMAL(12,4) NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "stock_levels_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "stock_movements" (
  "id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "warehouse_id" UUID NOT NULL,
  "type" "MovementType" NOT NULL,
  "quantity" DECIMAL(12,4) NOT NULL,
  "previous_qty" DECIMAL(12,4) NOT NULL,
  "resulting_qty" DECIMAL(12,4) NOT NULL,
  "reference_id" TEXT,
  "reference_type" TEXT,
  "notes" TEXT,
  "performed_by" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "stock_reservations" (
  "id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "warehouse_id" UUID NOT NULL,
  "transaction_id" UUID,
  "quantity" DECIMAL(12,4) NOT NULL,
  "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
  "expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
CREATE INDEX "stock_levels_product_id_idx" ON "stock_levels"("product_id");
CREATE INDEX "stock_levels_warehouse_id_idx" ON "stock_levels"("warehouse_id");
CREATE UNIQUE INDEX "stock_levels_product_id_warehouse_id_key" ON "stock_levels"("product_id", "warehouse_id");
CREATE INDEX "stock_movements_product_id_idx" ON "stock_movements"("product_id");
CREATE INDEX "stock_movements_warehouse_id_idx" ON "stock_movements"("warehouse_id");
CREATE INDEX "stock_movements_reference_id_reference_type_idx" ON "stock_movements"("reference_id", "reference_type");
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");
CREATE INDEX "stock_reservations_product_id_warehouse_id_status_idx" ON "stock_reservations"("product_id", "warehouse_id", "status");
CREATE INDEX "stock_reservations_transaction_id_idx" ON "stock_reservations"("transaction_id");
CREATE INDEX "stock_reservations_expires_at_idx" ON "stock_reservations"("expires_at");

ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
