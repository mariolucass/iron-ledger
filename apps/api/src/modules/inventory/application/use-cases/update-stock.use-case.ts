import type {
  InventoryRepository,
  StockMovementInput,
} from "../../domain/repositories/inventory.repository";

/** Movimentação manual; o evento `Inventory.StockUpdated` vai para o outbox no mesmo commit. */
export class UpdateStockUseCase {
  constructor(private readonly inventory: InventoryRepository) {}

  execute(input: StockMovementInput) {
    return this.inventory.createMovement(input);
  }
}
