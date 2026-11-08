import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { ModuleContext } from "../../shared/worker-module";
import { composeActivities, discoverModules } from "../module-registry";

const context = {} as ModuleContext;

function modulesDir(modules: Record<string, string | null>) {
  const dir = mkdtempSync(join(tmpdir(), "worker-modules-"));
  for (const [name, source] of Object.entries(modules)) {
    mkdirSync(join(dir, name, "workflows"), { recursive: true });
    if (source) writeFileSync(join(dir, name, "module.js"), source);
    writeFileSync(join(dir, name, "workflows", "index.js"), "");
  }
  return dir;
}
const moduleSource = (name: string, activities: string[]) =>
  `exports.workerModule = { name: ${JSON.stringify(name)}, createActivities: () => ({ ${activities
    .map((activity) => `${activity}: async () => undefined`)
    .join(", ")} }) };`;

test("the real modules are discovered with their workflow entry points", () => {
  const modules = discoverModules();
  const transaction = modules.find(({ name }) => name === "transaction");
  assert.ok(transaction?.workflowsEntry);
  assert.deepEqual(
    modules.map(({ name }) => name),
    [...modules.map(({ name }) => name)].sort(),
  );
});

test("modules are composed from folders alone and folders without a module file are ignored", () => {
  const dir = modulesDir({ billing: moduleSource("billing", ["charge"]), draft: null });
  try {
    const modules = discoverModules(dir);
    assert.deepEqual(
      modules.map(({ name }) => name),
      ["billing"],
    );
    assert.deepEqual(Object.keys(composeActivities(modules, context)), ["charge"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a module whose name differs from its folder is rejected", () => {
  const dir = modulesDir({ billing: moduleSource("invoices", ["charge"]) });
  try {
    assert.throws(() => discoverModules(dir), /billing/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("two modules registering the same activity name fail instead of overriding silently", () => {
  const dir = modulesDir({
    billing: moduleSource("billing", ["notify"]),
    shipping: moduleSource("shipping", ["notify"]),
  });
  try {
    assert.throws(
      () => composeActivities(discoverModules(dir), context),
      /"notify".*"billing".*"shipping"/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
