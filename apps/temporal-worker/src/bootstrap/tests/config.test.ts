import assert from "node:assert/strict";
import { test } from "node:test";
import { loadConfig } from "../config";

test("configuration supports legacy credentials and validates service credential pairs", () => {
  const config = loadConfig({ SEED_ADMIN_EMAIL: "admin", SEED_ADMIN_PASSWORD: "seed" });
  assert.equal(config.serviceEmail, "admin");
  assert.equal(config.taskQueue, "iron-ledger-tasks");
  assert.equal(config.maxConcurrentActivities, 20);
  assert.equal(config.shutdownGraceMs, 30_000);
  const tuned = loadConfig({
    SEED_ADMIN_EMAIL: "admin",
    SEED_ADMIN_PASSWORD: "seed",
    WORKER_MAX_CONCURRENT_ACTIVITIES: "5",
    WORKER_SHUTDOWN_GRACE_SECONDS: "10",
  });
  assert.equal(tuned.maxConcurrentActivities, 5);
  assert.equal(tuned.shutdownGraceMs, 10_000);
  assert.throws(() =>
    loadConfig({
      SEED_ADMIN_EMAIL: "a",
      SEED_ADMIN_PASSWORD: "b",
      WORKER_MAX_CONCURRENT_ACTIVITIES: "0",
    }),
  );
  assert.throws(() => loadConfig({ WORKER_SERVICE_EMAIL: "worker", SEED_ADMIN_PASSWORD: "seed" }));
  assert.throws(() =>
    loadConfig({ API_URL: "ftp://api", SEED_ADMIN_EMAIL: "a", SEED_ADMIN_PASSWORD: "b" }),
  );
});
