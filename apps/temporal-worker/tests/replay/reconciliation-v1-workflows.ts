import {
  ApplicationFailure,
  CancellationScope,
  isCancellation,
  patched,
  proxyActivities,
} from "@temporalio/workflow";
import type { TransactionSagaInput, TransactionSagaResult } from "@iron-ledger/workflow-contracts";
import type { TransactionActivities } from "../../src/modules/transaction/contracts/transaction-activities";
import { runTransactionSaga } from "../../src/modules/transaction/workflows/run-transaction-saga";

/** Snapshot of the workflow as deployed with only the reconciliation-v1 patch. */
const operations = proxyActivities<TransactionActivities>({
  startToCloseTimeout: "60 seconds",
  scheduleToCloseTimeout: "5 minutes",
  retry: { initialInterval: "1 second", backoffCoefficient: 2, maximumAttempts: 3 },
});
const recovery = proxyActivities<TransactionActivities>({
  startToCloseTimeout: "60 seconds",
  scheduleToCloseTimeout: "15 minutes",
  retry: { initialInterval: "2 seconds", maximumInterval: "30 seconds", maximumAttempts: 10 },
});

export async function transactionSaga(input: TransactionSagaInput): Promise<TransactionSagaResult> {
  if (!patched("transaction-saga-reconciliation-v1")) throw new Error("not used in this snapshot");
  return runTransactionSaga(
    input,
    {
      reserveStock: operations.reserveStock,
      confirmTransaction: operations.confirmTransaction,
      compensateStock: recovery.compensateStock,
      reconcileReservation: recovery.reconcileReservation,
    },
    {
      nonCancellable: (operation) => CancellationScope.nonCancellable(operation),
      isCancellation,
      unresolved: (message, transactionId, cause) =>
        ApplicationFailure.create({
          message,
          type: "RECONCILIATION_REQUIRED",
          nonRetryable: true,
          details: [
            { transactionId, reason: cause instanceof Error ? cause.message : String(cause) },
          ],
        }),
    },
  );
}
