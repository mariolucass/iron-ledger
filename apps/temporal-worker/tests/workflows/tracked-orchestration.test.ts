import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  RecordSagaStepInput,
  ReportTransactionOutcomeInput,
} from "@iron-ledger/workflow-contracts";
import { runTrackedTransactionSaga } from "../../src/modules/transaction/workflows/run-tracked-transaction-saga";
import type { TransactionActivities } from "../../src/modules/transaction/contracts/transaction-activities";
import type { TransactionLifecycleActivities } from "../../src/modules/transaction/contracts/transaction-lifecycle-activities";

const input = { transactionId: "txn", stockLevelId: "stock", quantity: 1, failConfirmation: false };
const cancelled = new Error("cancelled");
let clock = 0;
const runtime = {
  nonCancellable: async <T>(run: () => Promise<T>) => run(),
  isCancellation: (error: unknown) => error === cancelled,
  unresolved: (message: string, transactionId: string, cause: unknown) =>
    Object.assign(new Error(message), { type: "RECONCILIATION_REQUIRED", transactionId, cause }),
  now: () => new Date(Date.UTC(2026, 9, 18, 12, 0, clock++)).toISOString(),
};

function lifecycle() {
  const steps: RecordSagaStepInput[] = [];
  const outcomes: ReportTransactionOutcomeInput[] = [];
  const activities: TransactionLifecycleActivities = {
    recordSagaStep: async (step) => {
      steps.push(step);
    },
    reportTransactionOutcome: async (outcome) => {
      outcomes.push(outcome);
    },
  };
  return { steps, outcomes, activities };
}

const defaults = (): TransactionActivities => ({
  reserveStock: async () => ({ id: "reservation" }),
  confirmTransaction: async () => ({ id: "movement" }),
  compensateStock: async () => {
    throw new Error("unexpected compensation");
  },
  reconcileReservation: async () => {
    throw new Error("unexpected reconciliation");
  },
});

const summary = (steps: RecordSagaStepInput[]) =>
  steps.map((step) => `${step.sequence}:${step.name}:${step.status}`);

test("success records each step with deterministic sequence and reports COMPLETED", async () => {
  const tracking = lifecycle();
  const result = await runTrackedTransactionSaga(input, defaults(), tracking.activities, runtime);
  assert.deepEqual(result, {
    status: "COMPLETED",
    reservationId: "reservation",
    movementId: "movement",
  });
  assert.deepEqual(summary(tracking.steps), [
    "1:reserveStock:RUNNING",
    "1:reserveStock:SUCCEEDED",
    "2:confirmTransaction:RUNNING",
    "2:confirmTransaction:SUCCEEDED",
  ]);
  assert.deepEqual(tracking.steps[1]?.output, { reservationId: "reservation" });
  assert.ok(tracking.steps[1]?.finishedAt);
  assert.deepEqual(tracking.outcomes, [{ transactionId: "txn", outcome: result }]);
});

test("failed confirmation records the failure, the compensation step and reports COMPENSATED", async () => {
  const tracking = lifecycle();
  const activities = defaults();
  activities.confirmTransaction = async () => {
    throw Object.assign(new Error("Activity task failed"), {
      cause: { message: "Falha de confirmação solicitada", type: "DEMO" },
    });
  };
  activities.reconcileReservation = async () => ({
    status: "ACTIVE",
    reservationId: "reservation",
  });
  activities.compensateStock = async () => {};
  const result = await runTrackedTransactionSaga(input, activities, tracking.activities, runtime);
  assert.equal(result.status, "COMPENSATED");
  assert.equal(result.status === "COMPENSATED" && result.reason, "Falha de confirmação solicitada");
  assert.deepEqual(summary(tracking.steps), [
    "1:reserveStock:RUNNING",
    "1:reserveStock:SUCCEEDED",
    "2:confirmTransaction:RUNNING",
    "2:confirmTransaction:FAILED",
    "3:reconcileReservation:RUNNING",
    "3:reconcileReservation:SUCCEEDED",
    "4:compensateStock:RUNNING",
    "4:compensateStock:SUCCEEDED",
  ]);
  assert.equal(tracking.steps[3]?.error, "Falha de confirmação solicitada");
  assert.equal(
    tracking.steps.find((step) => step.name === "compensateStock")?.kind,
    "COMPENSATION",
  );
  assert.equal(tracking.outcomes[0]?.outcome.status, "COMPENSATED");
});

test("step tracking failures never change the business result", async () => {
  const tracking = lifecycle();
  tracking.activities.recordSagaStep = async () => {
    throw new Error("API down");
  };
  const result = await runTrackedTransactionSaga(input, defaults(), tracking.activities, runtime);
  assert.equal(result.status, "COMPLETED");
  assert.equal(tracking.outcomes.length, 1);
});

test("an outcome that cannot be reported fails the workflow", async () => {
  const tracking = lifecycle();
  tracking.activities.reportTransactionOutcome = async () => {
    throw new Error("API down");
  };
  await assert.rejects(
    runTrackedTransactionSaga(input, defaults(), tracking.activities, runtime),
    /API down/,
  );
});

test("unresolved reconciliation reports FAILED with the failure type and rethrows", async () => {
  const tracking = lifecycle();
  const activities = defaults();
  activities.reserveStock = async () => {
    throw new Error("timeout");
  };
  activities.reconcileReservation = async () => ({ status: "NOT_FOUND" });
  await assert.rejects(
    runTrackedTransactionSaga(input, activities, tracking.activities, runtime),
    (error: any) => error.type === "RECONCILIATION_REQUIRED",
  );
  assert.deepEqual(tracking.outcomes[0]?.outcome, {
    status: "FAILED",
    reason: "timeout",
    failureCode: "RECONCILIATION_REQUIRED",
  });
});

test("cancellation releases the reservation and reports CANCELLED", async () => {
  const tracking = lifecycle();
  let released = false;
  const activities = defaults();
  activities.confirmTransaction = async () => {
    throw cancelled;
  };
  activities.reconcileReservation = async () => ({
    status: "ACTIVE",
    reservationId: "reservation",
  });
  activities.compensateStock = async () => {
    released = true;
  };
  await assert.rejects(
    runTrackedTransactionSaga(input, activities, tracking.activities, runtime),
    (error) => error === cancelled,
  );
  assert.ok(released);
  assert.equal(tracking.outcomes[0]?.outcome.status, "CANCELLED");
});
