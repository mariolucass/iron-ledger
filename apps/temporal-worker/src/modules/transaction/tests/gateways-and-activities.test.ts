import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiClient } from "../../../shared/http/api-client";
import { ApiError } from "../../../shared/http/api-error";
import { createLifecycleActivities } from "../activities/create-lifecycle-activities";
import { createTransactionActivities } from "../activities/create-transaction-activities";
import { InventoryApiGateway } from "../gateways/inventory-api.gateway";
import { TransactionApiGateway } from "../gateways/transaction-api.gateway";
import type { InventoryGateway } from "../ports/inventory-gateway";

const fakeFetch = (run: (input: string | URL | Request, init?: RequestInit) => Promise<Response>) =>
  run as typeof fetch;

test("gateway rejects malformed successful responses and encodes reservation IDs", async () => {
  const urls: string[] = [];
  const client = new ApiClient(
    "http://api",
    { getToken: async () => "token", invalidate() {} },
    fakeFetch(async (url) => {
      urls.push(String(url));
      return Response.json({ unexpected: true });
    }),
  );
  const gateway = new InventoryApiGateway(client);
  await assert.rejects(
    gateway.commit("a/b"),
    (error: unknown) => error instanceof ApiError && error.code === "INVALID_API_RESPONSE",
  );
  assert.equal(urls[0], "http://api/inventory/reservations/a%2Fb/commit");
  await assert.rejects(gateway.findByTransaction("tx"));
});

test("activities translate gateway classification and keep demonstration failure non-retryable", async () => {
  const gateway: InventoryGateway = {
    reserve: async () => {
      throw new ApiError("insufficient", 409, "INSUFFICIENT_STOCK");
    },
    commit: async () => {
      throw new ApiError("unavailable", 503);
    },
    release: async () => {},
    findByTransaction: async () => ({ status: "NOT_FOUND" }),
  };
  const activities = createTransactionActivities(gateway);
  await assert.rejects(
    activities.reserveStock({ stockLevelId: "stock", transactionId: "tx", quantity: 1 }),
    (error: any) => error.type === "INSUFFICIENT_STOCK" && error.nonRetryable,
  );
  await assert.rejects(
    activities.confirmTransaction({ reservationId: "id", failConfirmation: false }),
    (error: any) => error.type === "HTTP_503" && !error.nonRetryable,
  );
  await assert.rejects(
    activities.confirmTransaction({ reservationId: "id", failConfirmation: true }),
    (error: any) => error.nonRetryable,
  );
});

test("transaction lifecycle gateway posts steps and outcomes to the transaction context", async () => {
  const calls: Array<{ url: string; body: unknown }> = [];
  const client = new ApiClient(
    "http://api",
    { getToken: async () => "token", invalidate() {} },
    fakeFetch(async (url, init) => {
      calls.push({ url: String(url), body: JSON.parse(String(init?.body)) });
      return new Response(null, { status: 204 });
    }),
  );
  const gateway = new TransactionApiGateway(client);
  await gateway.recordStep({
    transactionId: "t/1",
    sequence: 1,
    name: "reserveStock",
    kind: "ACTION",
    status: "RUNNING",
    startedAt: "2026-10-18T12:00:00.000Z",
  });
  await gateway.reportOutcome({ transactionId: "t1", outcome: { status: "FAILED", reason: "x" } });
  assert.equal(calls[0]?.url, "http://api/transactions/t%2F1/steps");
  assert.equal((calls[0]?.body as { transactionId?: string }).transactionId, undefined);
  assert.equal(calls[1]?.url, "http://api/transactions/t1/outcome");
  assert.deepEqual(calls[1]?.body, { status: "FAILED", reason: "x" });
});

test("lifecycle activities keep the gateway retry classification", async () => {
  const activities = createLifecycleActivities({
    recordStep: async () => {
      throw new ApiError("conflict", 409, "TRANSACTION_ALREADY_FINALIZED");
    },
    reportOutcome: async () => {
      throw new ApiError("down", 503);
    },
  });
  await assert.rejects(
    activities.recordSagaStep({
      transactionId: "t",
      sequence: 1,
      name: "reserveStock",
      kind: "ACTION",
      status: "RUNNING",
      startedAt: "x",
    }),
    (error: any) => error.type === "TRANSACTION_ALREADY_FINALIZED" && error.nonRetryable,
  );
  await assert.rejects(
    activities.reportTransactionOutcome({
      transactionId: "t",
      outcome: { status: "CANCELLED", reason: "x" },
    }),
    (error: any) => error.type === "HTTP_503" && !error.nonRetryable,
  );
});
