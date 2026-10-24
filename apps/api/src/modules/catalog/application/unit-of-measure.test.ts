import { describe, expect, it } from "vitest";
import { createUnitSchema, listUnitsSchema } from "./unit-of-measure";

describe("createUnitSchema", () => {
  it("normaliza o código e aplica os padrões do cadastro", () => {
    expect(createUnitSchema.parse({ code: " kg ", name: " Quilograma ", type: "WEIGHT" }))
      .toEqual({ code: "KG", name: "Quilograma", type: "WEIGHT", precision: 0, isActive: true });
  });
  it.each([-1, 1.5, 7])("rejeita precisão inválida: %s", (precision) => {
    expect(createUnitSchema.safeParse({ code: "KG", name: "Quilograma", type: "WEIGHT", precision }).success).toBe(false);
  });
  it("rejeita tipo inexistente", () => {
    expect(createUnitSchema.safeParse({ code: "KG", name: "Quilograma", type: "OTHER" }).success).toBe(false);
  });
});

describe("listUnitsSchema", () => {
  it("limita o tamanho da página", () => {
    expect(listUnitsSchema.safeParse({ pageSize: 101 }).success).toBe(false);
  });
});
