import type { PaginationQuery } from "@/shared/api/client";

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "DISCONTINUED", "ARCHIVED"] as const;
export const TRACKING_MODES = ["NONE", "LOT", "SERIAL"] as const;
export const BARCODE_TYPES = [
  "EAN_13",
  "EAN_8",
  "UPC_A",
  "GTIN_14",
  "CODE_128",
  "QR_CODE",
  "INTERNAL",
] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
export type TrackingMode = (typeof TRACKING_MODES)[number];
export type BarcodeType = (typeof BARCODE_TYPES)[number];

export interface ProductBarcode {
  id?: string;
  code: string;
  type: BarcodeType;
  quantity: number;
  isPrimary: boolean;
}

/** Read model returned by GET /products. */
export interface ProductSummary {
  id: string;
  sku: string;
  name: string;
  unit: string;
  status: ProductStatus;
  isActive: boolean;
  trackingMode: TrackingMode;
  minStock: number;
  standardCost: number | null;
  salePrice: number | null;
  brand: string | null;
  currency: string;
  categoryId: string | null;
  categoryName: string | null;
  updatedAt: string;
  totalQuantity: number;
}

/** Read model returned by GET /products/:id. */
export interface Product extends Omit<ProductSummary, "totalQuantity"> {
  description: string | null;
  baseUnitId: string | null;
  maxStock: number | null;
  reorderPoint: number | null;
  safetyStock: number | null;
  leadTimeDays: number | null;
  shelfLifeDays: number | null;
  weightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  ncm: string | null;
  barcodes: Required<ProductBarcode>[];
  images?: string[];
  stockSummary?: {
    quantity: number;
    reserved: number;
    available: number;
    incoming: number;
    warehouses: number;
  };
  version: number;
  createdAt: string;
}

export interface ProductQuery extends PaginationQuery {
  q?: string;
  status?: ProductStatus;
  categoryId?: string;
}

/** Writable fields; every optional field accepts `null` to clear it. */
export interface ProductInput {
  name: string;
  description: string | null;
  baseUnitId: string;
  categoryId: string | null;
  status: ProductStatus;
  trackingMode: TrackingMode;
  minStock: number;
  maxStock: number | null;
  reorderPoint: number | null;
  safetyStock: number | null;
  leadTimeDays: number | null;
  shelfLifeDays: number | null;
  weightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  ncm: string | null;
  standardCost: number | null;
  currency: string;
  barcodes: ProductBarcode[];
  images?: string[];
}

export type CreateProductInput = ProductInput & { sku: string };

export interface UnitOption {
  id: string;
  code: string;
  name: string;
  type: string;
  precision: number;
}
export interface CategoryOption {
  id: string;
  code: string;
  name: string;
  path: string;
  depth: number;
}
export interface ProductLookups {
  units: UnitOption[];
  categories: CategoryOption[];
}

export interface ProductInventoryRow {
  id: string; warehouseId: string; warehouseCode: string; warehouseName: string;
  quantity: number; reserved: number; available: number; incoming: number; updatedAt: string;
}
export interface ProductMovementRow {
  id: string; type: string; quantity: number; previousQuantity: number; resultingQuantity: number;
  warehouseId: string; warehouseName: string; referenceId: string | null;
  referenceType: string | null; notes: string | null; occurredAt: string;
}
export interface ProductLotRow {
  id: string; lotNumber: string; serialNumber: string | null; status: string;
  manufacturedAt: string | null; expiresAt: string | null; receivedAt: string | null;
  supplierRef: string | null; quantity: number; reserved: number;
}
export interface ProductUnitRow { unitId: string; code: string; name: string; precision: number; factor: number }
export interface ProductForecast {
  weeks: { week: string; quantity: number }[];
  forecastNextWeek: number | null;
  method: string;
}

// ─── Importação por planilha ─────────────────────────────────────────────────

export const PRODUCT_IMPORT_FIELDS = [
  "sku", "name", "category", "subcategory", "brand", "standardCost", "salePrice",
  "status", "unit", "description", "ncm", "minStock",
] as const;

export type ProductImportField = (typeof PRODUCT_IMPORT_FIELDS)[number];
export type ImportCell = string | number | boolean | null;
export type ImportExistingMode = "skip" | "update" | "error";
export type ImportRowAction = "create" | "update" | "skip" | "error";

/** Corpo de POST /products/imports/{preview,commit}. A primeira linha é o cabeçalho. */
export interface ProductImportRequest {
  rows: ImportCell[][];
  columns?: (ProductImportField | null)[];
  options: { defaultUnitId: string; onExisting: ImportExistingMode; createCategories: boolean };
}

export interface ProductImportRow {
  line: number;
  sku: string | null;
  name: string | null;
  category: string | null;
  action: ImportRowAction;
  errors: string[];
  warnings: string[];
}

export interface ProductImportReport {
  columns: { index: number; header: string; field: ProductImportField | null }[];
  missingRequired: ProductImportField[];
  rows: ProductImportRow[];
  summary: Record<ImportRowAction, number> & { total: number };
  categoriesToCreate: string[];
  committed: boolean;
}
