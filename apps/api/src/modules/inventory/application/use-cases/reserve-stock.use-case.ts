import type {
  InventoryRepository,
  StockReservationInput,
} from "../../domain/repositories/inventory.repository";

/** Idempotente por `transactionId`: a mesma reserva é devolvida sem novo evento. */
export class ReserveStockUseCase {
  constructor(private readonly inventory: InventoryRepository) {}

  execute(input: StockReservationInput) {
    return this.inventory.createReservation(input);
  }
}
