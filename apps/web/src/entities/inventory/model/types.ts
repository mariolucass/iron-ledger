import type { PaginationQuery } from "@/shared/api/client";

export type InventoryStatus = "CRITICAL" | "LOW" | "OK";
export type CreateMovementType =
  | "INBOUND"
  | "OUTBOUND"
  | "ADJUSTMENT"
  | "RETURN";
export type StockMovementType =
  | CreateMovementType
  | "TRANSFER"
  | "RESERVATION"
  | "RELEASE";
export type ReservationStatus = "ACTIVE" | "COMMITTED" | "RELEASED" | "EXPIRED";

/** Read model returned by GET /inventory, including product and warehouse projections. */
export interface InventoryItem {
  stockLevelId: string;
  productId: string;
  sku: string;
  productName: string;
  unit: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  reserved: number;
  available: number;
  minStock: number;
  status: InventoryStatus;
  updatedAt: string;
}

export interface InventoryQuery extends PaginationQuery {
  sku?: string;
  warehouseId?: string;
}

export interface StockMovement {
  id: string;
  stockLevelId: string;
  productId: string;
  sku: string;
  warehouseId: string;
  type: StockMovementType;
  quantity: number;
  previousQuantity: number;
  resultingQuantity: number;
  referenceId: string | null;
  referenceType: string | null;
  notes: string | null;
  performedBy: string;
  createdAt: string;
}

export interface StockReservation {
  id: string;
  stockLevelId: string;
  productId: string;
  sku: string;
  warehouseId: string;
  quantity: number;
  status: ReservationStatus;
  transactionId: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreateMovementInput {
  stockLevelId: string;
  type: CreateMovementType;
  quantity: number;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
}

export interface CreateReservationInput {
  stockLevelId: string;
  quantity: number;
  transactionId?: string;
  expiresAt?: string;
}

export interface CommitReservationResponse {
  movement: StockMovement;
  committed: boolean;
}
