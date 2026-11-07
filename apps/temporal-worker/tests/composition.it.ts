import assert from "node:assert/strict";
import { test } from "node:test";
import { discoverModules } from "../src/bootstrap/module-registry";
import { bundleModuleWorkflows } from "../src/bootstrap/workflow-bundle";

test("the workflow bundle is generated from the discovered modules", async () => {
  const bundle = await bundleModuleWorkflows(discoverModules());
  assert.match(bundle.code, /transactionSaga/);
});
