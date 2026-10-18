import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { ApiError, requestJson, withQuery } from "../src/shared/api/client";
import { inventoryApi } from "../src/entities/inventory/api/inventory-api";
import { auditLogApi } from "../src/entities/audit-log/api/audit-log-api";
import { warehouseApi } from "../src/entities/warehouse/api/warehouse-api";
import { userApi } from "../src/entities/user/api/user-api";
import { transactionApi } from "../src/entities/transaction/api/transaction-api";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

function mockResponse(body: unknown, status = 200) {
  const calls: Array<{ path: string; init: RequestInit }> = [];
  globalThis.fetch = async (input, init = {}) => {
    calls.push({ path: String(input), init });
    return Response.json(body, { status });
  };
  return calls;
}

test("query serialization preserves filters and excludes undefined values", () => {
  assert.equal(withQuery("/api/inventory", { sku: "A&B", warehouseId: undefined, page: 2 }), "/api/inventory?sku=A%26B&page=2");
  assert.equal(withQuery("/api/inventory"), "/api/inventory");
});

test("inventory keeps the backend read model and pagination intact", async () => {
  const body = {
    items: [{ stockLevelId: "stock", productId: "product", warehouseId: "warehouse", quantity: 12, reserved: 2, available: 10, unit: "un" }],
    page: 2, pageSize: 20, total: 42,
  };
  const calls = mockResponse(body);
  assert.deepEqual(await inventoryApi.list({ warehouseId: "warehouse", page: 2 }), body);
  assert.equal(calls[0].path, "/api/inventory?warehouseId=warehouse&page=2");
  assert.equal(calls[0].init.cache, "no-store");
});

test("movement and reservation mutations use the real endpoints and JSON bodies", async () => {
  const calls = mockResponse({ id: "created" }, 201);
  const movement = { stockLevelId: "stock", type: "ADJUSTMENT" as const, quantity: -2, referenceType: "MANUAL" };
  await inventoryApi.createMovement(movement);
  await inventoryApi.createReservation({ stockLevelId: "stock", quantity: 2, expiresAt: "2026-10-19T12:00:00Z" });
  await inventoryApi.releaseReservation("reservation/id");
  await inventoryApi.commitReservation("reservation/id");
  assert.deepEqual(calls.map(({ path }) => path), [
    "/api/inventory/movements", "/api/inventory/reservations",
    "/api/inventory/reservations/reservation%2Fid/release", "/api/inventory/reservations/reservation%2Fid/commit",
  ]);
  assert.ok(calls.every(({ init }) => init.method === "POST"));
  assert.equal(new Headers(calls[0].init.headers).get("content-type"), "application/json");
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), movement);
});

test("movement history encodes IDs and accepts pagination", async () => {
  const calls = mockResponse({ items: [], page: 3, pageSize: 5, total: 0 });
  await inventoryApi.listMovements("stock/id", { page: 3, pageSize: 5 });
  assert.equal(calls[0].path, "/api/inventory/stock%2Fid/movements?page=3&pageSize=5");
});

test("audit passes supported filters and warehouses preserve their IDs", async () => {
  const calls = mockResponse({ items: [{ id: "warehouse", code: "SP", name: "São Paulo", address: null, isActive: true }] });
  const result = await warehouseApi.list();
  assert.equal(result.items[0].id, "warehouse");
  await auditLogApi.list({ actor: "user@example.com", entityType: "Inventory", from: "2026-10-01T00:00:00Z", pageSize: 100 });
  const url = new URL(calls[1].path, "http://localhost");
  assert.equal(calls[0].path, "/api/warehouses");
  assert.equal(url.pathname, "/api/audit");
  assert.equal(url.searchParams.get("actor"), "user@example.com");
  assert.equal(url.searchParams.get("entityType"), "Inventory");
  assert.equal(url.searchParams.get("from"), "2026-10-01T00:00:00Z");
});

test("user authentication uses the cookie BFF contract", async () => {
  const user = { id: "user", name: "Maria", email: "maria@example.com", roles: ["ADMIN"] };
  const calls = mockResponse({ user });
  assert.deepEqual(await userApi.login({ email: user.email, password: "password", remember: true }), { user });
  await userApi.logout();
  assert.deepEqual(calls.map(({ path }) => path), ["/api/auth/login", "/api/auth/logout"]);
  assert.ok(calls.every(({ init }) => !new Headers(init.headers).has("authorization")));
});

test("transaction client starts a saga idempotently, lists with filters and reads the detail", async () => {
  const calls = mockResponse({ id: "txn", code: "TXN-1", status: "PROCESSING", steps: [], items: [], history: [] }, 202);
  await transactionApi.start({ stockLevelId: "stock", quantity: 3, failConfirmation: true }, { idempotencyKey: "web-key-0001" });
  await transactionApi.list({ status: "COMPENSATED", page: 2, pageSize: 20 });
  await transactionApi.get("txn/id");
  assert.equal(calls[0].path, "/api/transactions");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(new Headers(calls[0].init.headers).get("idempotency-key"), "web-key-0001");
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), { stockLevelId: "stock", quantity: 3, failConfirmation: true });
  assert.equal(calls[1].path, "/api/transactions?status=COMPENSATED&page=2&pageSize=20");
  assert.equal(calls[2].path, "/api/transactions/txn%2Fid");
  assert.ok(calls.every(({ init }) => !new Headers(init.headers).has("authorization")));
});

test("API errors preserve status and code without navigating from entities", async () => {
  mockResponse({ error: "UNAUTHORIZED", message: "Sessão ausente." }, 401);
  await assert.rejects(inventoryApi.list(), (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 401);
    assert.equal(error.code, "UNAUTHORIZED");
    assert.equal(error.message, "Sessão ausente.");
    return true;
  });
});

test("non-JSON upstream errors receive a usable fallback", async () => {
  globalThis.fetch = async () => new Response("Bad gateway", { status: 502 });
  await assert.rejects(requestJson("/api/inventory"), (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 502);
    assert.equal(error.message, "Não foi possível consultar a API.");
    return true;
  });
});
