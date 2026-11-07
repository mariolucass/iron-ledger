import assert from "node:assert/strict";
import { test } from "node:test";
import { ServiceTokenProvider } from "../auth/service-token-provider";
import { ApiClient } from "../http/api-client";
import { ApiError } from "../http/api-error";

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
