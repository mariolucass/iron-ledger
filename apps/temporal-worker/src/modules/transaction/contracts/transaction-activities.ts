import type { ReservationSnapshot } from "@iron-ledger/workflow-contracts/transaction";

/** Stable activity names and payloads are part of Temporal history compatibility. */
export interface TransactionActivities {
  reserveStock(input: {
    stockLevelId: string;
    quantity: number;
    transactionId: string;
  }): Promise<{ id: string }>;
  confirmTransaction(input: {
    reservationId: string;
    failConfirmation: boolean;
  }): Promise<{ id: string }>;
  compensateStock(reservationId: string): Promise<void>;
  reconcileReservation(transactionId: string): Promise<ReservationSnapshot>;
}
