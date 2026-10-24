import type {
  InventoryListQuery,
  InventoryRepository,
} from "../../domain/repositories/inventory.repository";

/** Lado de leitura do inventory (saldos, movimentos e reconciliação da Saga). */
export class QueryInventoryUseCase {
  constructor(private readonly inventory: InventoryRepository) {}

  list(query: InventoryListQuery) {
    return this.inventory.list(query);
  }

  async warehouses() {
    return { items: await this.inventory.listWarehouses() };
  }

  movements(stockLevelId: string, page: number, pageSize: number) {
    return this.inventory.listMovements(stockLevelId, page, pageSize);
  }

  reservationByTransaction(transactionId: string) {
    return this.inventory.findReservationByTransaction(transactionId);
  }
}
