import type { AuditablePayload, EventEnvelope } from "./envelope";

export type StockUpdatedPayload = AuditablePayload & {
  correlationId?: string;
  movementId: string;
  productId: string;
  sku: string;
  warehouseId: string;
  type: string;
  quantity: number;
  previousQuantity: number;
  resultingQuantity: number;
};

export type StockReservationPayload = AuditablePayload & {
  correlationId?: string;
  reservationId: string;
  productId: string;
  sku: string;
  warehouseId: string;
  quantity: number;
  status: string;
};

export type StockUpdated = EventEnvelope<"Inventory.StockUpdated", StockUpdatedPayload>;
export type StockReserved = EventEnvelope<"Inventory.StockReserved", StockReservationPayload>;
export type StockReleased = EventEnvelope<"Inventory.StockReleased", StockReservationPayload>;

export type InventoryEvent = StockUpdated | StockReserved | StockReleased;
