import type { PaginationQuery } from "@/shared/api/client";

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "DISCONTINUED", "ARCHIVED"] as const;
export const TRACKING_MODES = ["NONE", "LOT", "SERIAL"] as const;
export const BARCODE_TYPES = ["EAN_13", "EAN_8", "UPC_A", "GTIN_14", "CODE_128", "QR_CODE", "INTERNAL"] as const;

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
}

export type CreateProductInput = ProductInput & { sku: string };

export interface UnitOption { id: string; code: string; name: string; type: string; precision: number }
export interface CategoryOption { id: string; code: string; name: string; path: string; depth: number }
export interface ProductLookups { units: UnitOption[]; categories: CategoryOption[] }
