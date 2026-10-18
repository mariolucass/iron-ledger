import type { TransactionSagaInput, TransactionSagaResult } from "@iron-ledger/workflow-contracts";
import type { TransactionActivities } from "../contracts/transaction-activities";
import { describeFailure } from "./describe-failure";

export interface RecoveryRuntime {
  nonCancellable<T>(operation: () => Promise<T>): Promise<T>;
  isCancellation(error: unknown): boolean;
  unresolved(message: string, transactionId: string, cause: unknown): Error;
}

/** Pure orchestration, executed inside the Temporal workflow runtime. No I/O implementation is imported. */
export async function runTransactionSaga(
  input: TransactionSagaInput,
  activities: TransactionActivities,
  runtime: RecoveryRuntime,
): Promise<TransactionSagaResult> {
  try {
    const reservation = await activities.reserveStock(input);
    const movement = await activities.confirmTransaction({ reservationId: reservation.id, failConfirmation: input.failConfirmation });
    return { status: "COMPLETED", reservationId: reservation.id, movementId: movement.id };
  } catch (failure) {
    const result = await runtime.nonCancellable(async (): Promise<TransactionSagaResult> => {
      try {
        const snapshot = await activities.reconcileReservation(input.transactionId);
        if (snapshot.status === "NOT_FOUND") {
          // A timed-out HTTP handler may still finish later. Do not claim rollback from absence alone.
          throw runtime.unresolved("Não foi possível determinar o resultado da reserva.", input.transactionId, failure);
        }
        if (snapshot.status === "COMMITTED") {
          // Idempotent commit also retries publication of its stable audit event after a lost response.
          const movement = await activities.confirmTransaction({ reservationId: snapshot.reservationId, failConfirmation: false });
          return { status: "COMPLETED", reservationId: snapshot.reservationId, movementId: movement.id };
        }
        if (snapshot.status === "ACTIVE") await activities.compensateStock(snapshot.reservationId);
        return {
          status: "COMPENSATED",
          reservationId: snapshot.reservationId,
          reason: describeFailure(failure).message,
        };
      } catch (recoveryFailure) {
        throw runtime.unresolved("A reconciliação exige acompanhamento operacional.", input.transactionId, recoveryFailure);
      }
    });
    if (runtime.isCancellation(failure)) throw failure;
    return result;
  }
}
