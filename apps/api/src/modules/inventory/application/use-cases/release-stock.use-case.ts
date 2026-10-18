import type { EventPublisher } from "../../../../infra/messaging/rabbitmq.client";
import { stockReservationEvent } from "../../domain/events/stock-reserved.event";
import type { InventoryRepository } from "../../domain/repositories/inventory.repository";
import type { ReleaseStockDto } from "../dtos/reserve-stock.dto";

export class ReleaseStockUseCase {
  constructor(private readonly inventory: InventoryRepository, private readonly events: EventPublisher) {}

  async execute(input: ReleaseStockDto) {
    const reservation = await this.inventory.releaseReservation(input);
    await this.events.publish(stockReservationEvent("Inventory.StockReleased", reservation, input.actorId, input.correlationId));
    return reservation;
  }
}
