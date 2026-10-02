import type { ReleaseStockDto, ReserveStockDto } from "../../application/dtos/reserve-stock.dto";
import type { UpdateStockDto } from "../../application/dtos/update-stock.dto";

export type InventoryItem = {
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
  status: "CRITICAL" | "LOW" | "OK";
  updatedAt: string;
};

export type WarehouseSummary = {
  id: string;
  code: string;
  name: string;
  address: string | null;
  isActive: boolean;
};

export type StockMovementRecord = {
  id: string;
  stockLevelId: string;
  productId: string;
  sku: string;
  warehouseId: string;
  type: string;
  quantity: number;
  previousQuantity: number;
  resultingQuantity: number;
  referenceId: string | null;
  referenceType: string | null;
  notes: string | null;
  performedBy: string;
  createdAt: string;
};

export type StockReservationRecord = {
  id: string;
  stockLevelId: string;
  productId: string;
  sku: string;
  warehouseId: string;
  quantity: number;
  status: string;
  transactionId: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export interface InventoryRepository {
  list(input: { sku?: string; warehouseId?: string; page: number; pageSize: number }): Promise<{
    items: InventoryItem[];
    page: number;
    pageSize: number;
    total: number;
  }>;
  listWarehouses(): Promise<WarehouseSummary[]>;
  listMovements(stockLevelId: string, page: number, pageSize: number): Promise<{
    items: StockMovementRecord[];
    page: number;
    pageSize: number;
    total: number;
  }>;
  createMovement(input: UpdateStockDto): Promise<StockMovementRecord>;
  createReservation(input: ReserveStockDto): Promise<StockReservationRecord>;
  releaseReservation(input: ReleaseStockDto): Promise<StockReservationRecord>;
  commitReservation(input: { reservationId: string; actorId: string }): Promise<{ movement: StockMovementRecord; committed: boolean }>;
}
