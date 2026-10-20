import {
  ApplicationFailure,
  CancellationScope,
  isCancellation,
  patched,
  proxyActivities,
} from "@temporalio/workflow";
import type { TransactionSagaInput, TransactionSagaResult } from "@iron-ledger/workflow-contracts";
import type { TransactionActivities } from "../contracts/transaction-activities";
import type { TransactionLifecycleActivities } from "../contracts/transaction-lifecycle-activities";
import {
  legacyOptions,
  operationOptions,
  outcomeReportingOptions,
  recoveryOptions,
  stepTrackingOptions,
} from "../policies/activity-options";
import { runTrackedTransactionSaga } from "./run-tracked-transaction-saga";
import { runTransactionSaga } from "./run-transaction-saga";

const legacy = proxyActivities<TransactionActivities>(legacyOptions);
const operations = proxyActivities<TransactionActivities>(operationOptions);
const recovery = proxyActivities<TransactionActivities>(recoveryOptions);
const stepTracking =
  proxyActivities<Pick<TransactionLifecycleActivities, "recordSagaStep">>(stepTrackingOptions);
const outcomeReporting =
  proxyActivities<Pick<TransactionLifecycleActivities, "reportTransactionOutcome">>(
    outcomeReportingOptions,
  );

/** Marcadores de versão; nunca renomear nem remover enquanto houver histories antigas. */
export const RECONCILIATION_PATCH = "transaction-saga-reconciliation-v1";
export const LIFECYCLE_PATCH = "transaction-saga-lifecycle-v2";

export async function transactionSaga(input: TransactionSagaInput): Promise<TransactionSagaResult> {
  if (!patched(RECONCILIATION_PATCH)) {
    // Preserve the exact original activity sequence and payloads for pre-patch history.
    const reservation = await legacy.reserveStock(input);
    try {
      const movement = await legacy.confirmTransaction({
        reservationId: reservation.id,
        failConfirmation: input.failConfirmation,
      });
      return { status: "COMPLETED", reservationId: reservation.id, movementId: movement.id };
    } catch (error) {
      await legacy.compensateStock(reservation.id);
      return {
        status: "COMPENSATED",
        reservationId: reservation.id,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  }

  const activities: TransactionActivities = {
    reserveStock: operations.reserveStock,
    confirmTransaction: operations.confirmTransaction,
    compensateStock: recovery.compensateStock,
    reconcileReservation: recovery.reconcileReservation,
  };
  const runtime = {
    nonCancellable: <T>(operation: () => Promise<T>) => CancellationScope.nonCancellable(operation),
    isCancellation,
    unresolved: (message: string, transactionId: string, cause: unknown) =>
      ApplicationFailure.create({
        message,
        type: "RECONCILIATION_REQUIRED",
        nonRetryable: true,
        details: [
          { transactionId, reason: cause instanceof Error ? cause.message : String(cause) },
        ],
      }),
  };

  if (!patched(LIFECYCLE_PATCH)) {
    // Histories da v1: mesma sequência de activities, sem o rastro na API.
    return runTransactionSaga(input, activities, runtime);
  }

  return runTrackedTransactionSaga(
    input,
    activities,
    {
      recordSagaStep: stepTracking.recordSagaStep,
      reportTransactionOutcome: outcomeReporting.reportTransactionOutcome,
    },
    {
      ...runtime,
      // Date dentro do sandbox do workflow é determinística (hora da task).
      now: () => new Date().toISOString(),
    },
  );
}
