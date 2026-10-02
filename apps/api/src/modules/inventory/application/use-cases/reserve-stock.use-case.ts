import type { RabbitMqClient } from "../../../../infra/messaging/rabbitmq.client";
import { stockReservationEvent } from "../../domain/events/stock-reserved.event";
import type { InventoryRepository } from "../../domain/repositories/inventory.repository";
import type { ReserveStockDto } from "../dtos/reserve-stock.dto";

export class ReserveStockUseCase {
  constructor(private readonly inventory: InventoryRepository, private readonly events: Pick<RabbitMqClient, "publish">) {}

  async execute(input: ReserveStockDto) {
    const reservation = await this.inventory.createReservation(input);
    await this.events.publish(stockReservationEvent("Inventory.StockReserved", reservation, input.actorId, input.correlationId));
    return reservation;
  }
}
