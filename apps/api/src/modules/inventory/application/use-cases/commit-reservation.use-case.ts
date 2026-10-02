import type { RabbitMqClient } from "../../../../infra/messaging/rabbitmq.client";
import { stockUpdatedEvent } from "../../domain/events/stock-updated.event";
import type { InventoryRepository } from "../../domain/repositories/inventory.repository";

export class CommitReservationUseCase {
  constructor(private readonly inventory: InventoryRepository, private readonly events: Pick<RabbitMqClient, "publish">) {}

  async execute(input: { reservationId: string; actorId: string; correlationId?: string }) {
    const result = await this.inventory.commitReservation(input);
    const event = stockUpdatedEvent({
      stockLevelId: result.movement.stockLevelId,
      type: "OUTBOUND",
      quantity: result.movement.quantity,
      referenceId: result.movement.referenceId ?? undefined,
      actorId: input.actorId,
      correlationId: input.correlationId,
    }, result.movement);
    event.eventId = `Inventory.StockUpdated:${result.movement.id}`;
    await this.events.publish(event);
    return result.movement;
  }
}
