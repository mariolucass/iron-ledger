import assert from "node:assert/strict";
import { test } from "node:test";
import { createEvent, InMemoryEventBus, isDomainEvent, matchesBinding, routingKeyFor } from "./index";

test("routing keys follow the documented convention", () => {
  assert.equal(routingKeyFor("Inventory.StockUpdated"), "inventory.stock.updated");
  assert.equal(routingKeyFor("Transaction.TransactionCompleted"), "transaction.transaction.completed");
});

test("topic bindings support * and #", () => {
  assert.ok(matchesBinding("#", "inventory.stock.updated"));
  assert.ok(matchesBinding("inventory.stock.*", "inventory.stock.updated"));
  assert.ok(!matchesBinding("inventory.stock.*", "inventory.stock.updated.v2"));
  assert.ok(matchesBinding("transaction.#", "transaction.transaction.completed"));
  assert.ok(matchesBinding("transaction.#", "transaction"));
  assert.ok(matchesBinding("#.completed", "transaction.transaction.completed"));
  assert.ok(!matchesBinding("inventory.#", "transaction.transaction.completed"));
});

test("createEvent fills the envelope and accepts a stable identifier", () => {
  const event = createEvent({ eventName: "Transaction.TransactionStarted", producer: "api", payload: { a: 1 }, eventId: "fixed", correlationId: "c" });
  assert.equal(event.eventId, "fixed");
  assert.equal(event.eventVersion, 1);
  assert.equal(event.producer, "api");
  assert.ok(isDomainEvent(event));
  assert.ok(!isDomainEvent({ eventName: "x" }));
});

test("each queue receives its own copy and failures end in dead-letter", async () => {
  const bus = new InMemoryEventBus();
  const audit: string[] = [];
  let attempts = 0;
  await bus.subscribe({ queue: "audit", bindingKey: "#" }, async (event) => { audit.push(event.eventName); });
  await bus.subscribe({ queue: "broken", bindingKey: "transaction.#", maxAttempts: 3 }, async () => { attempts++; throw new Error("down"); });
  await bus.publish(createEvent({ eventName: "Transaction.TransactionStarted", producer: "api", payload: {} }));
  assert.deepEqual(audit, ["Transaction.TransactionStarted"]);
  assert.equal(attempts, 3);
  assert.equal(bus.deadLetters[0]?.queue, "broken");
});
