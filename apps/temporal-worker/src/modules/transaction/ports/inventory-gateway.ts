import type { ReservationSnapshot } from "@iron-ledger/workflow-contracts/transaction";

export interface ReserveStockInput {
  stockLevelId: string;
  quantity: number;
  transactionId: string;
}

export interface InventoryGateway {
  reserve(input: ReserveStockInput, correlationId?: string): Promise<{ id: string }>;
  commit(reservationId: string, correlationId?: string): Promise<{ id: string }>;
  release(reservationId: string, correlationId?: string): Promise<void>;
  findByTransaction(transactionId: string, correlationId?: string): Promise<ReservationSnapshot>;
}
