import assert from "node:assert/strict";
import { test } from "node:test";
import { runTransactionSaga } from "../../src/modules/transaction/workflows/run-transaction-saga";
import type { TransactionActivities } from "../../src/modules/transaction/contracts/transaction-activities";

const input = { transactionId:"txn",stockLevelId:"stock",quantity:1,failConfirmation:false };
const cancelled = new Error("cancelled");
const runtime = {
  nonCancellable: async <T>(run: () => Promise<T>) => run(),
  isCancellation: (error: unknown) => error === cancelled,
  unresolved: (message: string, transactionId: string, cause: unknown) => Object.assign(new Error(message), {type:"RECONCILIATION_REQUIRED", transactionId, cause}),
};
const defaults = (): TransactionActivities => ({
  reserveStock: async () => ({id:"reservation"}),
  confirmTransaction: async () => ({id:"movement"}),
  compensateStock: async () => { throw new Error("unexpected compensation"); },
  reconcileReservation: async () => { throw new Error("unexpected reconciliation"); },
});

test("successful transaction preserves public result", async () => {
  assert.deepEqual(await runTransactionSaga(input,defaults(),runtime), {status:"COMPLETED",reservationId:"reservation",movementId:"movement"});
});

test("lost reservation response is reconciled and released", async () => {
  let released = "";
  const activities = defaults();
  activities.reserveStock = async () => { throw new Error("response lost"); };
  activities.reconcileReservation = async () => ({status:"ACTIVE",reservationId:"reservation"});
  activities.compensateStock = async id => { released = id; };
  assert.equal((await runTransactionSaga(input,activities,runtime)).status,"COMPENSATED");
  assert.equal(released,"reservation");
});

test("lost commit response never releases committed stock and retries idempotent event publication", async () => {
  let confirmations = 0;
  const activities = defaults();
  activities.confirmTransaction = async value => {
    if (++confirmations === 1) throw new Error("response lost");
    assert.equal(value.failConfirmation,false);
    return {id:"existing-movement"};
  };
  activities.reconcileReservation = async () => ({status:"COMMITTED",reservationId:"reservation",movementId:"existing-movement"});
  const result = await runTransactionSaga(input,activities,runtime);
  assert.equal(result.status,"COMPLETED");
  assert.equal(confirmations,2);
});

test("unknown reservation outcomes fail explicitly instead of claiming compensation", async () => {
  const activities = defaults();
  activities.reserveStock = async () => { throw new Error("timeout"); };
  activities.reconcileReservation = async () => ({status:"NOT_FOUND"});
  await assert.rejects(runTransactionSaga(input,activities,runtime),(error:any)=> error.type === "RECONCILIATION_REQUIRED" && error.transactionId === "txn");
});

test("failed compensation remains unresolved", async () => {
  const activities = defaults();
  activities.confirmTransaction = async () => { throw new Error("failed"); };
  activities.reconcileReservation = async () => ({status:"ACTIVE",reservationId:"reservation"});
  activities.compensateStock = async () => { throw new Error("API down"); };
  await assert.rejects(runTransactionSaga(input,activities,runtime),(error:any)=>error.type === "RECONCILIATION_REQUIRED");
});

test("cancellation performs cleanup before propagating cancellation", async () => {
  let released = false;
  const activities = defaults();
  activities.confirmTransaction = async () => { throw cancelled; };
  activities.reconcileReservation = async () => ({status:"ACTIVE",reservationId:"reservation"});
  activities.compensateStock = async () => { released = true; };
  await assert.rejects(runTransactionSaga(input,activities,runtime),error=>error===cancelled);
  assert.ok(released);
});

test("an already released reservation does not repeat the release operation", async () => {
  const activities = defaults();
  activities.confirmTransaction = async () => { throw new Error("failed"); };
  activities.reconcileReservation = async () => ({status:"RELEASED",reservationId:"reservation"});
  assert.equal((await runTransactionSaga(input,activities,runtime)).status,"COMPENSATED");
});
