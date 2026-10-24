import type {
  InventoryRepository,
  ReservationActionInput,
} from "../../domain/repositories/inventory.repository";

/** Liberar uma reserva já liberada devolve o mesmo registro sem novo evento. */
export class ReleaseStockUseCase {
  constructor(private readonly inventory: InventoryRepository) {}

  execute(input: ReservationActionInput) {
    return this.inventory.releaseReservation(input);
  }
}
