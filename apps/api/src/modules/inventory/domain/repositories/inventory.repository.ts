import type { ReservationSnapshot } from "@iron-ledger/workflow-contracts";
import type { StockStatus } from "../entities/stock-level.entity";
import type { StockMovementType } from "../entities/stock-movement.entity";

/** Quem executa a mutação e a correlação propagada para os eventos. */
export type MutationContext = {
  actorId: string;
  correlationId?: string;
};

export type StockMovementInput = MutationContext & {
  stockLevelId: string;
  type: StockMovementType;
  quantity: number;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
};

export type StockReservationInput = MutationContext & {
  stockLevelId: string;
  quantity: number;
  transactionId?: string;
  expiresAt?: Date;
};

export type ReservationActionInput = MutationContext & { reservationId: string };

export type InventoryListQuery = {
  sku?: string;
  q?: string;
  warehouseId?: string;
  page: number;
  pageSize: number;
};

export type Page<T> = { items: T[]; page: number; pageSize: number; total: number };

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
  status: StockStatus;
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

/**
 * Porta do contexto inventory. As mutações gravam o saldo, o movimento/reserva e
 * os eventos no outbox em uma única transação; repetições idempotentes devolvem
 * o registro existente sem gerar novo evento.
 */
export interface InventoryRepository {
  list(query: InventoryListQuery): Promise<Page<InventoryItem>>;
  listWarehouses(): Promise<WarehouseSummary[]>;
  findReservationByTransaction(transactionId: string): Promise<ReservationSnapshot>;
  listMovements(
    stockLevelId: string,
    page: number,
    pageSize: number,
  ): Promise<Page<StockMovementRecord>>;
  createMovement(input: StockMovementInput): Promise<StockMovementRecord>;
  createReservation(input: StockReservationInput): Promise<StockReservationRecord>;
  releaseReservation(input: ReservationActionInput): Promise<StockReservationRecord>;
  commitReservation(input: ReservationActionInput): Promise<StockMovementRecord>;
}
