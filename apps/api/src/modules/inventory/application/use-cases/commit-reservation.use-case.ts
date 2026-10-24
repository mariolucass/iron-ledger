import type {
  InventoryRepository,
  ReservationActionInput,
} from "../../domain/repositories/inventory.repository";

/** Confirmar de novo devolve o movimento original sem novo evento (activities at-least-once). */
export class CommitReservationUseCase {
  constructor(private readonly inventory: InventoryRepository) {}

  execute(input: ReservationActionInput) {
    return this.inventory.commitReservation(input);
  }
}
