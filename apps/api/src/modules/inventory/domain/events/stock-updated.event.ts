import { randomUUID } from "node:crypto";
import type { StockUpdated } from "@iron-ledger/shared-types";
import { EVENT_PRODUCER } from "../../../../infra/messaging/rabbitmq.client";
import type { UpdateStockDto } from "../../application/dtos/update-stock.dto";
import type { StockMovementRecord } from "../repositories/inventory.repository";

export function stockUpdatedEvent(input: UpdateStockDto, movement: StockMovementRecord): StockUpdated {
  return {
    eventId: randomUUID(),
    eventName: "Inventory.StockUpdated",
    eventVersion: 1,
    occurredAt: new Date().toISOString(),
    producer: EVENT_PRODUCER,
    aggregateType: "StockLevel",
    aggregateId: movement.stockLevelId,
    correlationId: input.correlationId,
    actorId: input.actorId,
    payload: {
      entityType: "Inventory",
      entityId: movement.stockLevelId,
      action: "UPDATE",
      correlationId: input.correlationId,
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
