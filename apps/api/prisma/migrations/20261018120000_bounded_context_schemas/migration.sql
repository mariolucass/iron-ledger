-- =============================================================================
-- Bounded contexts em schemas PostgreSQL dedicados.
--
-- As tabelas e enums existentes são MOVIDOS com SET SCHEMA (sem perda de dados;
-- índices, constraints e FKs acompanham a tabela). Em seguida, o diff gerado
-- pelo Prisma adiciona as novas colunas, enums, tabelas, índices e FKs.
-- =============================================================================

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "identity";
CREATE SCHEMA IF NOT EXISTS "catalog";
CREATE SCHEMA IF NOT EXISTS "warehouse";
CREATE SCHEMA IF NOT EXISTS "inventory";
CREATE SCHEMA IF NOT EXISTS "transaction";
CREATE SCHEMA IF NOT EXISTS "audit";
CREATE SCHEMA IF NOT EXISTS "analytics";
CREATE SCHEMA IF NOT EXISTS "platform";

-- MoveEnum
ALTER TYPE "public"."UserStatus" SET SCHEMA "identity";
ALTER TYPE "public"."PermissionAction" SET SCHEMA "identity";
ALTER TYPE "public"."MovementType" SET SCHEMA "inventory";
ALTER TYPE "public"."ReservationStatus" SET SCHEMA "inventory";

-- MoveTable
ALTER TABLE "public"."users" SET SCHEMA "identity";
ALTER TABLE "public"."roles" SET SCHEMA "identity";
ALTER TABLE "public"."permissions" SET SCHEMA "identity";
ALTER TABLE "public"."user_roles" SET SCHEMA "identity";
ALTER TABLE "public"."role_permissions" SET SCHEMA "identity";
ALTER TABLE "public"."products" SET SCHEMA "catalog";
ALTER TABLE "public"."warehouses" SET SCHEMA "warehouse";
ALTER TABLE "public"."stock_levels" SET SCHEMA "inventory";
ALTER TABLE "public"."stock_movements" SET SCHEMA "inventory";
ALTER TABLE "public"."stock_reservations" SET SCHEMA "inventory";
ALTER TABLE "public"."audit_logs" SET SCHEMA "audit";

-- CreateEnum
CREATE TYPE "analytics"."AlertType" AS ENUM ('LOW_STOCK', 'STOCKOUT', 'OVERSTOCK', 'LOT_EXPIRING', 'STALE_RESERVATION', 'DEMAND_ANOMALY', 'SAGA_FAILURE', 'COUNT_VARIANCE');

-- CreateEnum
CREATE TYPE "analytics"."AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "analytics"."AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'SUPPRESSED');

-- CreateEnum
CREATE TYPE "analytics"."NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SLACK', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "analytics"."ForecastGranularity" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "analytics"."JobRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "analytics"."ReportFormat" AS ENUM ('CSV', 'XLSX', 'PDF', 'JSON');

-- CreateEnum
CREATE TYPE "catalog"."ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DISCONTINUED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "catalog"."TrackingMode" AS ENUM ('NONE', 'LOT', 'SERIAL');

-- CreateEnum
CREATE TYPE "catalog"."UnitOfMeasureType" AS ENUM ('UNIT', 'WEIGHT', 'VOLUME', 'LENGTH', 'AREA', 'TIME');

-- CreateEnum
CREATE TYPE "catalog"."BarcodeType" AS ENUM ('EAN_13', 'EAN_8', 'UPC_A', 'GTIN_14', 'CODE_128', 'QR_CODE', 'INTERNAL');

-- CreateEnum
CREATE TYPE "identity"."WarehouseAccessLevel" AS ENUM ('VIEWER', 'OPERATOR', 'SUPERVISOR', 'MANAGER');

-- CreateEnum
CREATE TYPE "identity"."SessionStatus" AS ENUM ('ACTIVE', 'ROTATED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "identity"."MfaMethod" AS ENUM ('TOTP', 'WEBAUTHN', 'EMAIL_OTP', 'RECOVERY_CODE');

-- CreateEnum
CREATE TYPE "identity"."IdentityProvider" AS ENUM ('OIDC', 'SAML', 'GOOGLE', 'MICROSOFT', 'GITHUB');

-- CreateEnum
CREATE TYPE "identity"."VerificationPurpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'INVITATION');

-- CreateEnum
CREATE TYPE "identity"."ApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "inventory"."LotStatus" AS ENUM ('AVAILABLE', 'QUARANTINE', 'BLOCKED', 'EXPIRED', 'CONSUMED');

-- CreateEnum
CREATE TYPE "inventory"."TransferStatus" AS ENUM ('DRAFT', 'REQUESTED', 'APPROVED', 'IN_TRANSIT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "inventory"."StockCountType" AS ENUM ('FULL', 'CYCLE', 'SPOT');

-- CreateEnum
CREATE TYPE "inventory"."StockCountStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'PENDING_REVIEW', 'APPROVED', 'POSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "platform"."OutboxStatus" AS ENUM ('PENDING', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "platform"."InboxStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "platform"."IdempotencyStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "platform"."SettingScope" AS ENUM ('SYSTEM', 'WAREHOUSE', 'USER');

-- CreateEnum
CREATE TYPE "transaction"."TransactionType" AS ENUM ('SALE', 'PURCHASE_RECEIPT', 'TRANSFER', 'RETURN', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "transaction"."TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'COMPENSATING', 'COMPENSATED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "transaction"."TransactionItemStatus" AS ENUM ('PENDING', 'RESERVED', 'CONFIRMED', 'RELEASED', 'FAILED');

-- CreateEnum
CREATE TYPE "transaction"."SagaStepKind" AS ENUM ('ACTION', 'COMPENSATION');

-- CreateEnum
CREATE TYPE "transaction"."SagaStepStatus" AS ENUM ('SCHEDULED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED', 'TIMED_OUT');

-- CreateEnum
CREATE TYPE "warehouse"."WarehouseType" AS ENUM ('DISTRIBUTION_CENTER', 'STORE', 'FULFILLMENT_CENTER', 'CROSS_DOCK', 'THIRD_PARTY', 'VIRTUAL');

-- CreateEnum
CREATE TYPE "warehouse"."LocationType" AS ENUM ('ZONE', 'AISLE', 'RACK', 'SHELF', 'BIN', 'DOCK', 'STAGING', 'QUARANTINE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "identity"."PermissionAction" ADD VALUE 'EXECUTE';
ALTER TYPE "identity"."PermissionAction" ADD VALUE 'MANAGE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "inventory"."MovementType" ADD VALUE 'TRANSFER_OUT';
ALTER TYPE "inventory"."MovementType" ADD VALUE 'TRANSFER_IN';
ALTER TYPE "inventory"."MovementType" ADD VALUE 'CYCLE_COUNT';
ALTER TYPE "inventory"."MovementType" ADD VALUE 'SCRAP';

-- AlterTable
ALTER TABLE "audit"."audit_logs" ADD COLUMN     "actor_type" TEXT NOT NULL DEFAULT 'USER',
ADD COLUMN     "causation_id" TEXT,
ADD COLUMN     "event_version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "hash" TEXT,
ADD COLUMN     "ip_address" INET,
ADD COLUMN     "previous_hash" TEXT,
ADD COLUMN     "sequence" BIGSERIAL NOT NULL,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "user_agent" TEXT;

-- AlterTable
ALTER TABLE "catalog"."products" ADD COLUMN     "base_unit_id" UUID,
ADD COLUMN     "created_by" UUID,
ADD COLUMN     "currency" CHAR(3) NOT NULL DEFAULT 'BRL',
ADD COLUMN     "height_cm" DECIMAL(12,2),
ADD COLUMN     "lead_time_days" INTEGER,
ADD COLUMN     "length_cm" DECIMAL(12,2),
ADD COLUMN     "ncm" TEXT,
ADD COLUMN     "reorder_point" DECIMAL(18,4),
ADD COLUMN     "safety_stock" DECIMAL(18,4),
ADD COLUMN     "shelf_life_days" INTEGER,
ADD COLUMN     "standard_cost" DECIMAL(19,4),
ADD COLUMN     "status" "catalog"."ProductStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "tracking_mode" "catalog"."TrackingMode" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "updated_by" UUID,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weight_kg" DECIMAL(12,4),
ADD COLUMN     "width_cm" DECIMAL(12,2),
ALTER COLUMN "min_stock" SET DATA TYPE DECIMAL(18,4),
ALTER COLUMN "max_stock" SET DATA TYPE DECIMAL(18,4);

-- AlterTable
ALTER TABLE "identity"."users" ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "email_verified_at" TIMESTAMP(3),
ADD COLUMN     "external_id" TEXT,
ADD COLUMN     "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'pt-BR',
ADD COLUMN     "locked_until" TIMESTAMP(3),
ADD COLUMN     "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password_changed_at" TIMESTAMP(3),
ADD COLUMN     "preferences" JSONB,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "identity"."roles" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "parent_role_id" UUID,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "identity"."permissions" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "identity"."user_roles" ADD COLUMN     "expires_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "identity"."role_permissions" ADD COLUMN     "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "inventory"."stock_levels" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "incoming" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "last_counted_at" TIMESTAMP(3),
ADD COLUMN     "last_movement_at" TIMESTAMP(3),
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(18,4),
ALTER COLUMN "reserved" SET DATA TYPE DECIMAL(18,4);

-- AlterTable
ALTER TABLE "inventory"."stock_movements" ADD COLUMN     "causation_id" TEXT,
ADD COLUMN     "correlation_id" TEXT,
ADD COLUMN     "currency" CHAR(3),
ADD COLUMN     "idempotency_key" TEXT,
ADD COLUMN     "location_id" UUID,
ADD COLUMN     "lot_id" UUID,
ADD COLUMN     "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "reason_code" TEXT,
ADD COLUMN     "reservation_id" UUID,
ADD COLUMN     "stock_count_id" UUID,
ADD COLUMN     "transaction_id" UUID,
ADD COLUMN     "transfer_id" UUID,
ADD COLUMN     "unit_cost" DECIMAL(19,4),
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(18,4),
ALTER COLUMN "previous_qty" SET DATA TYPE DECIMAL(18,4),
ALTER COLUMN "resulting_qty" SET DATA TYPE DECIMAL(18,4);

-- AlterTable
ALTER TABLE "inventory"."stock_reservations" ADD COLUMN     "committed_at" TIMESTAMP(3),
ADD COLUMN     "created_by" UUID,
ADD COLUMN     "lot_id" UUID,
ADD COLUMN     "reference_id" TEXT,
ADD COLUMN     "reference_type" TEXT,
ADD COLUMN     "release_reason" TEXT,
ADD COLUMN     "released_at" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(18,4);

-- AlterTable
ALTER TABLE "warehouse"."warehouses" ADD COLUMN     "address_line" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country_code" CHAR(2) NOT NULL DEFAULT 'BR',
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "latitude" DECIMAL(9,6),
ADD COLUMN     "longitude" DECIMAL(9,6),
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "tax_id" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
ADD COLUMN     "type" "warehouse"."WarehouseType" NOT NULL DEFAULT 'DISTRIBUTION_CENTER',
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "analytics"."alert_rules" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "analytics"."AlertType" NOT NULL,
    "severity" "analytics"."AlertSeverity" NOT NULL DEFAULT 'WARNING',
    "product_id" UUID,
    "warehouse_id" UUID,
    "condition" JSONB NOT NULL,
    "cooldown_min" INTEGER NOT NULL DEFAULT 60,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."alert_rule_subscribers" (
    "rule_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "channel" "analytics"."NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "target" TEXT,
    "min_severity" "analytics"."AlertSeverity" NOT NULL DEFAULT 'WARNING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_rule_subscribers_pkey" PRIMARY KEY ("rule_id","user_id","channel")
);

-- CreateTable
CREATE TABLE "analytics"."alerts" (
    "id" UUID NOT NULL,
    "rule_id" UUID,
    "type" "analytics"."AlertType" NOT NULL,
    "severity" "analytics"."AlertSeverity" NOT NULL,
    "status" "analytics"."AlertStatus" NOT NULL DEFAULT 'OPEN',
    "dedup_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "product_id" UUID,
    "warehouse_id" UUID,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "payload" JSONB,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMP(3),
    "acknowledged_by" UUID,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" UUID,
    "resolution" TEXT,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."forecast_runs" (
    "id" UUID NOT NULL,
    "model_name" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "granularity" "analytics"."ForecastGranularity" NOT NULL DEFAULT 'WEEKLY',
    "horizon" INTEGER NOT NULL,
    "status" "analytics"."JobRunStatus" NOT NULL DEFAULT 'QUEUED',
    "parameters" JSONB,
    "metrics" JSONB,
    "error" TEXT,
    "trained_from" TIMESTAMP(3),
    "trained_to" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forecast_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."demand_forecasts" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "warehouse_id" UUID,
    "granularity" "analytics"."ForecastGranularity" NOT NULL,
    "period_start" DATE NOT NULL,
    "predicted" DECIMAL(18,4) NOT NULL,
    "lower_bound" DECIMAL(18,4),
    "upper_bound" DECIMAL(18,4),
    "confidence" DECIMAL(4,3),
    "actual" DECIMAL(18,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demand_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."inventory_snapshots" (
    "id" UUID NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "product_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "reserved" DECIMAL(18,4) NOT NULL,
    "available" DECIMAL(18,4) NOT NULL,
    "inbound_qty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "outbound_qty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(19,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."report_definitions" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parameters" JSONB,
    "schedule" TEXT,
    "format" "analytics"."ReportFormat" NOT NULL DEFAULT 'CSV',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."report_runs" (
    "id" UUID NOT NULL,
    "definition_id" UUID NOT NULL,
    "status" "analytics"."JobRunStatus" NOT NULL DEFAULT 'QUEUED',
    "format" "analytics"."ReportFormat" NOT NULL,
    "parameters" JSONB,
    "storage_key" TEXT,
    "size_bytes" BIGINT,
    "row_count" INTEGER,
    "error" TEXT,
    "requested_by" UUID,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "report_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit"."audit_log_changes" (
    "id" UUID NOT NULL,
    "audit_log_id" UUID NOT NULL,
    "field" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "is_masked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "audit_log_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."categories" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."product_categories" (
    "product_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("product_id","category_id")
);

-- CreateTable
CREATE TABLE "catalog"."product_barcodes" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "type" "catalog"."BarcodeType" NOT NULL DEFAULT 'EAN_13',
    "quantity" DECIMAL(18,4) NOT NULL DEFAULT 1,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_barcodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."units_of_measure" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "catalog"."UnitOfMeasureType" NOT NULL,
    "precision" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_of_measure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."product_unit_conversions" (
    "product_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "factor" DECIMAL(18,6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_unit_conversions_pkey" PRIMARY KEY ("product_id","unit_id")
);

-- CreateTable
CREATE TABLE "identity"."user_warehouse_accesses" (
    "user_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "access_level" "identity"."WarehouseAccessLevel" NOT NULL DEFAULT 'VIEWER',
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by" UUID,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "user_warehouse_accesses_pkey" PRIMARY KEY ("user_id","warehouse_id")
);

-- CreateTable
CREATE TABLE "identity"."user_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "status" "identity"."SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "user_agent" TEXT,
    "ip_address" INET,
    "replaced_by_id" UUID,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "revoked_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."mfa_factors" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "method" "identity"."MfaMethod" NOT NULL,
    "label" TEXT,
    "secret_encrypted" TEXT,
    "credential_id" TEXT,
    "public_key" BYTEA,
    "sign_count" INTEGER NOT NULL DEFAULT 0,
    "verified_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "mfa_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."federated_identities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" "identity"."IdentityProvider" NOT NULL,
    "provider_key" TEXT NOT NULL DEFAULT 'default',
    "subject" TEXT NOT NULL,
    "email" TEXT,
    "claims" JSONB,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "federated_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."verification_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "purpose" "identity"."VerificationPurpose" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."api_keys" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "status" "identity"."ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "allowed_ips" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."api_key_permissions" (
    "api_key_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_key_permissions_pkey" PRIMARY KEY ("api_key_id","permission_id")
);

-- CreateTable
CREATE TABLE "inventory"."inventory_lots" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "lot_number" TEXT NOT NULL,
    "serial_number" TEXT,
    "status" "inventory"."LotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "manufactured_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "supplier_ref" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."stock_counts" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "type" "inventory"."StockCountType" NOT NULL DEFAULT 'CYCLE',
    "status" "inventory"."StockCountStatus" NOT NULL DEFAULT 'PLANNED',
    "is_blind" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "posted_at" TIMESTAMP(3),
    "created_by" UUID NOT NULL,
    "approved_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."stock_count_items" (
    "id" UUID NOT NULL,
    "stock_count_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "location_id" UUID,
    "lot_id" UUID,
    "expected_quantity" DECIMAL(18,4) NOT NULL,
    "counted_quantity" DECIMAL(18,4),
    "variance" DECIMAL(18,4),
    "recount_required" BOOLEAN NOT NULL DEFAULT false,
    "counted_by" UUID,
    "counted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_count_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."location_stocks" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "lot_id" UUID,
    "quantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "reserved" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."stock_transfers" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "source_warehouse_id" UUID NOT NULL,
    "destination_warehouse_id" UUID NOT NULL,
    "status" "inventory"."TransferStatus" NOT NULL DEFAULT 'DRAFT',
    "transaction_id" UUID,
    "carrier" TEXT,
    "tracking_code" TEXT,
    "notes" TEXT,
    "requested_by" UUID NOT NULL,
    "approved_by" UUID,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "shipped_at" TIMESTAMP(3),
    "expected_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."stock_transfer_items" (
    "id" UUID NOT NULL,
    "transfer_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "lot_id" UUID,
    "requested_quantity" DECIMAL(18,4) NOT NULL,
    "shipped_quantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "received_quantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_transfer_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."settings" (
    "id" UUID NOT NULL,
    "scope" "platform"."SettingScope" NOT NULL DEFAULT 'SYSTEM',
    "scope_id" UUID,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "is_secret" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."feature_flags" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "rollout" INTEGER NOT NULL DEFAULT 0,
    "rules" JSONB,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."outbox_events" (
    "id" UUID NOT NULL,
    "sequence" BIGSERIAL NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_version" INTEGER NOT NULL DEFAULT 1,
    "exchange" TEXT NOT NULL DEFAULT 'iron-ledger.domain',
    "routing_key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "headers" JSONB,
    "correlation_id" TEXT,
    "causation_id" TEXT,
    "status" "platform"."OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "available_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked_until" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."inbox_messages" (
    "id" UUID NOT NULL,
    "message_id" TEXT NOT NULL,
    "consumer" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "status" "platform"."InboxStatus" NOT NULL DEFAULT 'RECEIVED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "inbox_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."idempotency_keys" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "status" "platform"."IdempotencyStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "response_status" INTEGER,
    "response_body" JSONB,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction"."saga_steps" (
    "id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "transaction"."SagaStepKind" NOT NULL DEFAULT 'ACTION',
    "status" "transaction"."SagaStepStatus" NOT NULL DEFAULT 'SCHEDULED',
    "activity_id" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "compensates_step_id" UUID,
    "input" JSONB,
    "output" JSONB,
    "error" JSONB,
    "scheduled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "saga_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction"."transactions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "type" "transaction"."TransactionType" NOT NULL,
    "status" "transaction"."TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "workflow_id" TEXT NOT NULL,
    "workflow_run_id" TEXT,
    "task_queue" TEXT,
    "idempotency_key" TEXT,
    "correlation_id" TEXT,
    "warehouse_id" UUID,
    "external_ref" TEXT,
    "currency" CHAR(3) NOT NULL DEFAULT 'BRL',
    "total_amount" DECIMAL(19,4),
    "failure_code" TEXT,
    "failure_reason" TEXT,
    "metadata" JSONB,
    "initiated_by" UUID NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "compensated_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction"."transaction_items" (
    "id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "line_number" INTEGER NOT NULL,
    "product_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit_price" DECIMAL(19,4),
    "status" "transaction"."TransactionItemStatus" NOT NULL DEFAULT 'PENDING',
    "reservation_id" UUID,
    "movement_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction"."transaction_status_history" (
    "id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "from_status" "transaction"."TransactionStatus",
    "to_status" "transaction"."TransactionStatus" NOT NULL,
    "reason" TEXT,
    "changed_by" UUID,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse"."warehouse_locations" (
    "id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "parent_id" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "type" "warehouse"."LocationType" NOT NULL,
    "path" TEXT NOT NULL,
    "is_pickable" BOOLEAN NOT NULL DEFAULT true,
    "is_receivable" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "max_weight_kg" DECIMAL(12,4),
    "max_volume_m3" DECIMAL(12,4),
    "pick_sequence" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "warehouse_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alert_rules_type_is_enabled_idx" ON "analytics"."alert_rules"("type", "is_enabled");

-- CreateIndex
CREATE INDEX "alert_rules_product_id_warehouse_id_idx" ON "analytics"."alert_rules"("product_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "alert_rule_subscribers_user_id_idx" ON "analytics"."alert_rule_subscribers"("user_id");

-- CreateIndex
CREATE INDEX "alerts_status_severity_triggered_at_idx" ON "analytics"."alerts"("status", "severity", "triggered_at");

-- CreateIndex
CREATE INDEX "alerts_dedup_key_status_idx" ON "analytics"."alerts"("dedup_key", "status");

-- CreateIndex
CREATE INDEX "alerts_product_id_warehouse_id_idx" ON "analytics"."alerts"("product_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "alerts_rule_id_idx" ON "analytics"."alerts"("rule_id");

-- CreateIndex
CREATE INDEX "forecast_runs_status_created_at_idx" ON "analytics"."forecast_runs"("status", "created_at");

-- CreateIndex
CREATE INDEX "forecast_runs_model_name_model_version_idx" ON "analytics"."forecast_runs"("model_name", "model_version");

-- CreateIndex
CREATE INDEX "demand_forecasts_product_id_warehouse_id_period_start_idx" ON "analytics"."demand_forecasts"("product_id", "warehouse_id", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "demand_forecasts_run_id_product_id_warehouse_id_period_star_key" ON "analytics"."demand_forecasts"("run_id", "product_id", "warehouse_id", "period_start");

-- CreateIndex
CREATE INDEX "inventory_snapshots_product_id_warehouse_id_snapshot_date_idx" ON "analytics"."inventory_snapshots"("product_id", "warehouse_id", "snapshot_date");

-- CreateIndex
CREATE INDEX "inventory_snapshots_warehouse_id_snapshot_date_idx" ON "analytics"."inventory_snapshots"("warehouse_id", "snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_snapshots_snapshot_date_product_id_warehouse_id_key" ON "analytics"."inventory_snapshots"("snapshot_date", "product_id", "warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_definitions_key_key" ON "analytics"."report_definitions"("key");

-- CreateIndex
CREATE INDEX "report_runs_definition_id_requested_at_idx" ON "analytics"."report_runs"("definition_id", "requested_at");

-- CreateIndex
CREATE INDEX "report_runs_requested_by_requested_at_idx" ON "analytics"."report_runs"("requested_by", "requested_at");

-- CreateIndex
CREATE INDEX "report_runs_status_idx" ON "analytics"."report_runs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "audit_log_changes_audit_log_id_field_key" ON "audit"."audit_log_changes"("audit_log_id", "field");

-- CreateIndex
CREATE UNIQUE INDEX "categories_code_key" ON "catalog"."categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "categories_path_key" ON "catalog"."categories"("path");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "catalog"."categories"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_parent_id_slug_key" ON "catalog"."categories"("parent_id", "slug");

-- CreateIndex
CREATE INDEX "product_categories_category_id_idx" ON "catalog"."product_categories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_barcodes_code_key" ON "catalog"."product_barcodes"("code");

-- CreateIndex
CREATE INDEX "product_barcodes_product_id_idx" ON "catalog"."product_barcodes"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "units_of_measure_code_key" ON "catalog"."units_of_measure"("code");

-- CreateIndex
CREATE INDEX "product_unit_conversions_unit_id_idx" ON "catalog"."product_unit_conversions"("unit_id");

-- CreateIndex
CREATE INDEX "user_warehouse_accesses_warehouse_id_idx" ON "identity"."user_warehouse_accesses"("warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refresh_token_hash_key" ON "identity"."user_sessions"("refresh_token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_replaced_by_id_key" ON "identity"."user_sessions"("replaced_by_id");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_status_idx" ON "identity"."user_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_sessions_family_id_idx" ON "identity"."user_sessions"("family_id");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "identity"."user_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "mfa_factors_credential_id_key" ON "identity"."mfa_factors"("credential_id");

-- CreateIndex
CREATE INDEX "mfa_factors_user_id_method_idx" ON "identity"."mfa_factors"("user_id", "method");

-- CreateIndex
CREATE INDEX "federated_identities_user_id_idx" ON "identity"."federated_identities"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "federated_identities_provider_provider_key_subject_key" ON "identity"."federated_identities"("provider", "provider_key", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_hash_key" ON "identity"."verification_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "verification_tokens_user_id_purpose_idx" ON "identity"."verification_tokens"("user_id", "purpose");

-- CreateIndex
CREATE INDEX "verification_tokens_expires_at_idx" ON "identity"."verification_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_prefix_key" ON "identity"."api_keys"("prefix");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "identity"."api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_owner_id_status_idx" ON "identity"."api_keys"("owner_id", "status");

-- CreateIndex
CREATE INDEX "api_key_permissions_permission_id_idx" ON "identity"."api_key_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "inventory_lots_status_expires_at_idx" ON "inventory"."inventory_lots"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_lots_product_id_lot_number_key" ON "inventory"."inventory_lots"("product_id", "lot_number");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_lots_product_id_serial_number_key" ON "inventory"."inventory_lots"("product_id", "serial_number");

-- CreateIndex
CREATE UNIQUE INDEX "stock_counts_code_key" ON "inventory"."stock_counts"("code");

-- CreateIndex
CREATE INDEX "stock_counts_warehouse_id_status_idx" ON "inventory"."stock_counts"("warehouse_id", "status");

-- CreateIndex
CREATE INDEX "stock_counts_scheduled_at_idx" ON "inventory"."stock_counts"("scheduled_at");

-- CreateIndex
CREATE INDEX "stock_count_items_product_id_idx" ON "inventory"."stock_count_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_count_items_stock_count_id_product_id_location_id_lot_key" ON "inventory"."stock_count_items"("stock_count_id", "product_id", "location_id", "lot_id");

-- CreateIndex
CREATE INDEX "location_stocks_product_id_warehouse_id_idx" ON "inventory"."location_stocks"("product_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "location_stocks_lot_id_idx" ON "inventory"."location_stocks"("lot_id");

-- CreateIndex
CREATE UNIQUE INDEX "location_stocks_location_id_product_id_lot_id_key" ON "inventory"."location_stocks"("location_id", "product_id", "lot_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfers_code_key" ON "inventory"."stock_transfers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfers_transaction_id_key" ON "inventory"."stock_transfers"("transaction_id");

-- CreateIndex
CREATE INDEX "stock_transfers_source_warehouse_id_status_idx" ON "inventory"."stock_transfers"("source_warehouse_id", "status");

-- CreateIndex
CREATE INDEX "stock_transfers_destination_warehouse_id_status_idx" ON "inventory"."stock_transfers"("destination_warehouse_id", "status");

-- CreateIndex
CREATE INDEX "stock_transfers_status_expected_at_idx" ON "inventory"."stock_transfers"("status", "expected_at");

-- CreateIndex
CREATE INDEX "stock_transfer_items_product_id_idx" ON "inventory"."stock_transfer_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfer_items_transfer_id_product_id_lot_id_key" ON "inventory"."stock_transfer_items"("transfer_id", "product_id", "lot_id");

-- CreateIndex
CREATE INDEX "settings_key_idx" ON "platform"."settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "settings_scope_scope_id_key_key" ON "platform"."settings"("scope", "scope_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "platform"."feature_flags"("key");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_events_sequence_key" ON "platform"."outbox_events"("sequence");

-- CreateIndex
CREATE INDEX "outbox_events_status_available_at_idx" ON "platform"."outbox_events"("status", "available_at");

-- CreateIndex
CREATE INDEX "outbox_events_aggregate_type_aggregate_id_sequence_idx" ON "platform"."outbox_events"("aggregate_type", "aggregate_id", "sequence");

-- CreateIndex
CREATE INDEX "outbox_events_correlation_id_idx" ON "platform"."outbox_events"("correlation_id");

-- CreateIndex
CREATE INDEX "inbox_messages_status_received_at_idx" ON "platform"."inbox_messages"("status", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "inbox_messages_consumer_message_id_key" ON "platform"."inbox_messages"("consumer", "message_id");

-- CreateIndex
CREATE INDEX "idempotency_keys_expires_at_idx" ON "platform"."idempotency_keys"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_scope_key_key" ON "platform"."idempotency_keys"("scope", "key");

-- CreateIndex
CREATE UNIQUE INDEX "saga_steps_compensates_step_id_key" ON "transaction"."saga_steps"("compensates_step_id");

-- CreateIndex
CREATE INDEX "saga_steps_status_scheduled_at_idx" ON "transaction"."saga_steps"("status", "scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "saga_steps_transaction_id_sequence_key" ON "transaction"."saga_steps"("transaction_id", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_code_key" ON "transaction"."transactions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_workflow_id_key" ON "transaction"."transactions"("workflow_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_idempotency_key_key" ON "transaction"."transactions"("idempotency_key");

-- CreateIndex
CREATE INDEX "transactions_status_created_at_idx" ON "transaction"."transactions"("status", "created_at");

-- CreateIndex
CREATE INDEX "transactions_type_status_idx" ON "transaction"."transactions"("type", "status");

-- CreateIndex
CREATE INDEX "transactions_warehouse_id_created_at_idx" ON "transaction"."transactions"("warehouse_id", "created_at");

-- CreateIndex
CREATE INDEX "transactions_initiated_by_created_at_idx" ON "transaction"."transactions"("initiated_by", "created_at");

-- CreateIndex
CREATE INDEX "transactions_correlation_id_idx" ON "transaction"."transactions"("correlation_id");

-- CreateIndex
CREATE INDEX "transactions_external_ref_idx" ON "transaction"."transactions"("external_ref");

-- CreateIndex
CREATE INDEX "transaction_items_product_id_warehouse_id_idx" ON "transaction"."transaction_items"("product_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "transaction_items_reservation_id_idx" ON "transaction"."transaction_items"("reservation_id");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_items_transaction_id_line_number_key" ON "transaction"."transaction_items"("transaction_id", "line_number");

-- CreateIndex
CREATE INDEX "transaction_status_history_transaction_id_changed_at_idx" ON "transaction"."transaction_status_history"("transaction_id", "changed_at");

-- CreateIndex
CREATE INDEX "warehouse_locations_parent_id_idx" ON "warehouse"."warehouse_locations"("parent_id");

-- CreateIndex
CREATE INDEX "warehouse_locations_warehouse_id_type_is_active_idx" ON "warehouse"."warehouse_locations"("warehouse_id", "type", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_locations_warehouse_id_code_key" ON "warehouse"."warehouse_locations"("warehouse_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_locations_warehouse_id_path_key" ON "warehouse"."warehouse_locations"("warehouse_id", "path");

-- CreateIndex
CREATE UNIQUE INDEX "audit_logs_sequence_key" ON "audit"."audit_logs"("sequence");

-- CreateIndex
CREATE INDEX "audit_logs_correlation_id_idx" ON "audit"."audit_logs"("correlation_id");

-- CreateIndex
CREATE INDEX "products_status_is_active_deleted_at_idx" ON "catalog"."products"("status", "is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "catalog"."products"("name");

-- CreateIndex
CREATE INDEX "products_base_unit_id_idx" ON "catalog"."products"("base_unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_external_id_key" ON "identity"."users"("external_id");

-- CreateIndex
CREATE INDEX "users_status_deleted_at_idx" ON "identity"."users"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "roles_parent_role_id_idx" ON "identity"."roles"("parent_role_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "identity"."user_roles"("role_id");

-- CreateIndex
CREATE INDEX "user_roles_expires_at_idx" ON "identity"."user_roles"("expires_at");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "identity"."role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_movements_idempotency_key_key" ON "inventory"."stock_movements"("idempotency_key");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_warehouse_id_created_at_idx" ON "inventory"."stock_movements"("product_id", "warehouse_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movements_reservation_id_idx" ON "inventory"."stock_movements"("reservation_id");

-- CreateIndex
CREATE INDEX "stock_movements_transaction_id_idx" ON "inventory"."stock_movements"("transaction_id");

-- CreateIndex
CREATE INDEX "stock_movements_correlation_id_idx" ON "inventory"."stock_movements"("correlation_id");

-- CreateIndex
CREATE INDEX "stock_movements_type_created_at_idx" ON "inventory"."stock_movements"("type", "created_at");

-- CreateIndex
CREATE INDEX "stock_reservations_status_expires_at_idx" ON "inventory"."stock_reservations"("status", "expires_at");

-- CreateIndex
CREATE INDEX "stock_reservations_reference_id_reference_type_idx" ON "inventory"."stock_reservations"("reference_id", "reference_type");

-- CreateIndex
CREATE INDEX "warehouses_is_active_deleted_at_idx" ON "warehouse"."warehouses"("is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "warehouses_type_idx" ON "warehouse"."warehouses"("type");

-- AddForeignKey
ALTER TABLE "analytics"."alert_rule_subscribers" ADD CONSTRAINT "alert_rule_subscribers_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "analytics"."alert_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."alerts" ADD CONSTRAINT "alerts_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "analytics"."alert_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."demand_forecasts" ADD CONSTRAINT "demand_forecasts_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "analytics"."forecast_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."report_runs" ADD CONSTRAINT "report_runs_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "analytics"."report_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit"."audit_log_changes" ADD CONSTRAINT "audit_log_changes_audit_log_id_fkey" FOREIGN KEY ("audit_log_id") REFERENCES "audit"."audit_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "catalog"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."product_categories" ADD CONSTRAINT "product_categories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."product_categories" ADD CONSTRAINT "product_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "catalog"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."products" ADD CONSTRAINT "products_base_unit_id_fkey" FOREIGN KEY ("base_unit_id") REFERENCES "catalog"."units_of_measure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."product_barcodes" ADD CONSTRAINT "product_barcodes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."product_unit_conversions" ADD CONSTRAINT "product_unit_conversions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."product_unit_conversions" ADD CONSTRAINT "product_unit_conversions_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "catalog"."units_of_measure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."roles" ADD CONSTRAINT "roles_parent_role_id_fkey" FOREIGN KEY ("parent_role_id") REFERENCES "identity"."roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."user_roles" ADD CONSTRAINT "user_roles_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "identity"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."user_warehouse_accesses" ADD CONSTRAINT "user_warehouse_accesses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."user_warehouse_accesses" ADD CONSTRAINT "user_warehouse_accesses_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."user_sessions" ADD CONSTRAINT "user_sessions_replaced_by_id_fkey" FOREIGN KEY ("replaced_by_id") REFERENCES "identity"."user_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."mfa_factors" ADD CONSTRAINT "mfa_factors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."federated_identities" ADD CONSTRAINT "federated_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."api_keys" ADD CONSTRAINT "api_keys_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."api_key_permissions" ADD CONSTRAINT "api_key_permissions_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "identity"."api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."api_key_permissions" ADD CONSTRAINT "api_key_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "identity"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."inventory_lots" ADD CONSTRAINT "inventory_lots_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock_counts" ADD CONSTRAINT "stock_counts_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock_count_items" ADD CONSTRAINT "stock_count_items_stock_count_id_fkey" FOREIGN KEY ("stock_count_id") REFERENCES "inventory"."stock_counts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock_count_items" ADD CONSTRAINT "stock_count_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock_count_items" ADD CONSTRAINT "stock_count_items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "warehouse"."warehouse_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock_count_items" ADD CONSTRAINT "stock_count_items_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "inventory"."inventory_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."location_stocks" ADD CONSTRAINT "location_stocks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."location_stocks" ADD CONSTRAINT "location_stocks_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."location_stocks" ADD CONSTRAINT "location_stocks_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "warehouse"."warehouse_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."location_stocks" ADD CONSTRAINT "location_stocks_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "inventory"."inventory_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock_movements" ADD CONSTRAINT "stock_movements_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "warehouse"."warehouse_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock_movements" ADD CONSTRAINT "stock_movements_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "inventory"."inventory_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock_movements" ADD CONSTRAINT "stock_movements_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "inventory"."stock_reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock_movements" ADD CONSTRAINT "stock_movements_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "inventory"."stock_transfers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock_movements" ADD CONSTRAINT "stock_movements_stock_count_id_fkey" FOREIGN KEY ("stock_count_id") REFERENCES "inventory"."stock_counts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock_reservations" ADD CONSTRAINT "stock_reservations_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "inventory"."inventory_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock_transfers" ADD CONSTRAINT "stock_transfers_source_warehouse_id_fkey" FOREIGN KEY ("source_warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock_transfers" ADD CONSTRAINT "stock_transfers_destination_warehouse_id_fkey" FOREIGN KEY ("destination_warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "inventory"."stock_transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "inventory"."inventory_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction"."saga_steps" ADD CONSTRAINT "saga_steps_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transaction"."transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction"."saga_steps" ADD CONSTRAINT "saga_steps_compensates_step_id_fkey" FOREIGN KEY ("compensates_step_id") REFERENCES "transaction"."saga_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction"."transaction_items" ADD CONSTRAINT "transaction_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transaction"."transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction"."transaction_status_history" ADD CONSTRAINT "transaction_status_history_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transaction"."transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse"."warehouse_locations" ADD CONSTRAINT "warehouse_locations_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse"."warehouse_locations" ADD CONSTRAINT "warehouse_locations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "warehouse"."warehouse_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

