import assert from "node:assert/strict";
import { test } from "node:test";
import { movementSchema } from "../src/features/record-stock-movement/model/movement-schema";

const stockLevelId = "123e4567-e89b-42d3-a456-426614174000";

test("movement form parses decimal input and trims optional text", () => {
  const result = movementSchema.parse({ stockLevelId, type: "INBOUND", quantity: "2.5", referenceId: "  REF-1  ", notes: "  " });
  assert.equal(result.quantity, 2.5);
  assert.equal(result.referenceId, "REF-1");
  assert.equal(result.notes, undefined);
});

test("adjustments accept negative quantities while other movement types require positive quantities", () => {
  assert.equal(movementSchema.parse({ stockLevelId, type: "ADJUSTMENT", quantity: "-2" }).quantity, -2);
  for (const type of ["INBOUND", "OUTBOUND", "RETURN"]) {
    assert.equal(movementSchema.safeParse({ stockLevelId, type, quantity: "-2" }).success, false);
    assert.equal(movementSchema.safeParse({ stockLevelId, type, quantity: "2" }).success, true);
  }
});

test("invalid stock IDs, zero, non-finite quantities and oversized references are rejected", () => {
  for (const quantity of ["", "0", "invalid", Infinity, NaN]) {
    assert.equal(movementSchema.safeParse({ stockLevelId, type: "ADJUSTMENT", quantity }).success, false);
  }
  assert.equal(movementSchema.safeParse({ stockLevelId: "", type: "INBOUND", quantity: 1 }).success, false);
  assert.equal(movementSchema.safeParse({ stockLevelId, type: "INBOUND", quantity: 1, referenceId: "x".repeat(121) }).success, false);
});
