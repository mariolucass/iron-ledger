import { randomUUID } from "node:crypto";
import type { StockReleased, StockReserved } from "@iron-ledger/shared-types";
import { EVENT_PRODUCER } from "../../../../shared/domain/domain-event";
import type { StockReservationRecord } from "../repositories/inventory.repository";

/** Gravado no outbox no mesmo commit da reserva; o `eventId` precisa ser UUID. */
export function stockReservationEvent(
  eventName: "Inventory.StockReserved" | "Inventory.StockReleased",
  reservation: StockReservationRecord,
  actorId: string,
  correlationId?: string,
): StockReserved | StockReleased {
  return {
    eventId: randomUUID(),
    eventName,
    eventVersion: 1,
    occurredAt: new Date().toISOString(),
    producer: EVENT_PRODUCER,
    aggregateType: "StockLevel",
    aggregateId: reservation.stockLevelId,
    correlationId,
    actorId,
    payload: {
      entityType: "Inventory",
      entityId: reservation.stockLevelId,
      action: "UPDATE",
      correlationId,
      reservationId: reservation.id,
      productId: reservation.productId,
      sku: reservation.sku,
      warehouseId: reservation.warehouseId,
      quantity: reservation.quantity,
      status: reservation.status,
    },
  };
}
