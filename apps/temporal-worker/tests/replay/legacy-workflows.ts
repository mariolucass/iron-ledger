import { proxyActivities } from "@temporalio/workflow";
import type { TransactionActivities } from "../../src/modules/transaction/contracts/transaction-activities";


const activities = proxyActivities<TransactionActivities>({
  startToCloseTimeout: "30 seconds",
  retry: { maximumAttempts: 3 },
});

export type TransactionSagaInput = {
  transactionId: string;
  stockLevelId: string;
  quantity: number;
  failConfirmation: boolean;
};

export async function transactionSaga(input: TransactionSagaInput): Promise<{
  status: "COMPLETED" | "COMPENSATED";
  reservationId: string;
  movementId?: string;
  reason?: string;
}> {
  const reservation = await activities.reserveStock(input);
  try {
    const movement = await activities.confirmTransaction({
      reservationId: reservation.id,
      failConfirmation: input.failConfirmation,
    });
    return { status: "COMPLETED", reservationId: reservation.id, movementId: movement.id };
  } catch (error) {
    await activities.compensateStock(reservation.id);
    return {
      status: "COMPENSATED",
      reservationId: reservation.id,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
