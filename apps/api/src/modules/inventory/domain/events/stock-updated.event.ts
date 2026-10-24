import { randomUUID } from "node:crypto";
import type { StockUpdated } from "@iron-ledger/shared-types";
import { EVENT_PRODUCER } from "../../../../shared/domain/domain-event";
import type { StockMovementRecord } from "../repositories/inventory.repository";

/** Gravado no outbox no mesmo commit do movimento; o `eventId` precisa ser UUID. */
export function stockUpdatedEvent(
  movement: StockMovementRecord,
  actorId: string,
  correlationId?: string,
): StockUpdated {
  return {
    eventId: randomUUID(),
    eventName: "Inventory.StockUpdated",
    eventVersion: 1,
    occurredAt: new Date().toISOString(),
    producer: EVENT_PRODUCER,
    aggregateType: "StockLevel",
    aggregateId: movement.stockLevelId,
    correlationId,
    actorId,
    payload: {
      entityType: "Inventory",
      entityId: movement.stockLevelId,
      action: "UPDATE",
      correlationId,
      movementId: movement.id,
      productId: movement.productId,
      sku: movement.sku,
      warehouseId: movement.warehouseId,
      type: movement.type,
      quantity: movement.quantity,
      previousQuantity: movement.previousQuantity,
      resultingQuantity: movement.resultingQuantity,
    },
  };
}
