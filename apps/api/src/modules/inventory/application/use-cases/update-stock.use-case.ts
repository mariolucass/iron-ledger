import type { EventPublisher } from "../../../../infra/messaging/rabbitmq.client";
import { stockUpdatedEvent } from "../../domain/events/stock-updated.event";
import type { InventoryRepository } from "../../domain/repositories/inventory.repository";
import type { UpdateStockDto } from "../dtos/update-stock.dto";

export class UpdateStockUseCase {
  constructor(private readonly inventory: InventoryRepository, private readonly events: EventPublisher) {}

  async execute(input: UpdateStockDto) {
    const movement = await this.inventory.createMovement(input);
    await this.events.publish(stockUpdatedEvent(input, movement));
    return movement;
  }
}
