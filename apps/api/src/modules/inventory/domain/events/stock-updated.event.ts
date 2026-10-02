import { randomUUID } from "node:crypto";
import type { DomainEvent } from "../../../../infra/messaging/rabbitmq.client";
import type { UpdateStockDto } from "../../application/dtos/update-stock.dto";
import type { StockMovementRecord } from "../repositories/inventory.repository";

export function stockUpdatedEvent(input: UpdateStockDto, movement: StockMovementRecord): DomainEvent {
  return {
    eventId: randomUUID(),
    eventName: "Inventory.StockUpdated",
    occurredAt: new Date().toISOString(),
    aggregateId: movement.stockLevelId,
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
