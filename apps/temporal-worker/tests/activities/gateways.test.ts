import assert from "node:assert/strict";
import { test } from "node:test";
import { ServiceTokenProvider } from "../../src/infrastructure/auth/service-token-provider";
import { ApiClient } from "../../src/infrastructure/http/api-client";
import { ApiError } from "../../src/infrastructure/http/api-error";
import { InventoryApiGateway } from "../../src/infrastructure/http/inventory-api.gateway";
import { TransactionApiGateway } from "../../src/infrastructure/http/transaction-api.gateway";
import { createLifecycleActivities } from "../../src/modules/transaction/activities/create-lifecycle-activities";
import { createTransactionActivities } from "../../src/modules/transaction/activities/create-transaction-activities";
import type { InventoryGateway } from "../../src/ports/inventory-gateway";
import { loadConfig } from "../../src/bootstrap/config";

const jwt = (exp: number) =>
  `header.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.signature`;
const fakeFetch = (run: (input: string | URL | Request, init?: RequestInit) => Promise<Response>) =>
  run as typeof fetch;

test("token provider shares concurrent logins and refreshes near expiry", async () => {
  let now = 1_000_000;
  let calls = 0;
  const provider = new ServiceTokenProvider({
    apiUrl: "http://api",
    email: "worker",
    password: "secret",
    now: () => now,
    fetch: fakeFetch(async () => {
      calls++;
      return Response.json({ accessToken: jwt(now / 1000 + 60) });
    }),
  });
  const tokens = await Promise.all([provider.getToken(), provider.getToken(), provider.getToken()]);
  assert.equal(new Set(tokens).size, 1);
  assert.equal(calls, 1);
  await provider.getToken();
  assert.equal(calls, 1);
  now += 35_000;
  await provider.getToken();
  assert.equal(calls, 2);
});

test("failed authentication does not poison future attempts or expose credentials", async () => {
  let calls = 0;
  const provider = new ServiceTokenProvider({
    apiUrl: "http://api",
    email: "worker",
    password: "secret",
    fetch: fakeFetch(async () =>
      ++calls === 1
        ? Response.json({}, { status: 401 })
        : Response.json({ accessToken: jwt(Date.now() / 1000 + 100) }),
    ),
  });
  await assert.rejects(
    provider.getToken(),
    (error: unknown) =>
      error instanceof ApiError && !error.retryable && !error.message.includes("secret"),
  );
  await provider.getToken();
  assert.equal(calls, 2);
});

test("HTTP client refreshes a rejected token once and preserves body and correlation ID", async () => {
  const calls: RequestInit[] = [];
  let invalidated = "";
  let tokenCalls = 0;
  const client = new ApiClient(
    "http://api",
    {
      getToken: async () => (++tokenCalls === 1 ? "old" : "new"),
      invalidate: (value) => {
        invalidated = value;
      },
    },
    fakeFetch(async (_url, init) => {
      calls.push(init!);
      return calls.length === 1
        ? Response.json({}, { status: 401 })
        : Response.json({ id: "reservation" });
    }),
  );
  assert.deepEqual(
    await client.request("POST", "/inventory/reservations", { quantity: 2 }, "txn"),
    { id: "reservation" },
  );
  assert.equal(invalidated, "old");
  assert.equal(calls.length, 2);
  const [first, retry] = calls;
  assert.ok(first && retry);
  assert.equal(new Headers(retry.headers).get("authorization"), "Bearer new");
  assert.equal(new Headers(retry.headers).get("x-correlation-id"), "txn");
  assert.equal(first.body, retry.body);
});

test("HTTP failures distinguish retryable concurrency, rate limiting and business errors", async () => {
  for (const [status, code, retryable] of [
    [409, "STOCK_CONFLICT", true],
    [409, "CONCURRENT_OPERATION", true],
    [409, "INSUFFICIENT_STOCK", false],
    [422, "VALIDATION_ERROR", false],
    [429, "RATE_LIMIT", true],
    [503, "DOWN", true],
  ] as const) {
    const error = new ApiError("failure", status, code);
    assert.equal(error.retryable, retryable);
  }
});

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

test("configuration supports legacy credentials and validates service credential pairs", () => {
  const config = loadConfig({ SEED_ADMIN_EMAIL: "admin", SEED_ADMIN_PASSWORD: "seed" });
  assert.equal(config.serviceEmail, "admin");
  assert.equal(config.taskQueue, "iron-ledger-tasks");
  assert.throws(() => loadConfig({ WORKER_SERVICE_EMAIL: "worker", SEED_ADMIN_PASSWORD: "seed" }));
  assert.throws(() =>
    loadConfig({ API_URL: "ftp://api", SEED_ADMIN_EMAIL: "a", SEED_ADMIN_PASSWORD: "b" }),
  );
});
