import type { DomainEvent } from "../../../../infra/messaging/rabbitmq.client";
import type { StockReservationRecord } from "../repositories/inventory.repository";

export function stockReservationEvent(
  eventName: "Inventory.StockReserved" | "Inventory.StockReleased",
  reservation: StockReservationRecord,
  actorId: string,
  correlationId?: string,
): DomainEvent {
  return {
    eventId: `${eventName}:${reservation.id}`,
    eventName,
    occurredAt: new Date().toISOString(),
    aggregateId: reservation.stockLevelId,
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
