import { describe, expect, it } from "vitest";
import { assertResultingBalance, availableQuantity, inventoryStatus, movementDelta } from "./inventory-domain.service";

describe("inventory domain service", () => {
  it("calcula saldo disponível e classificação", () => {
    expect(availableQuantity(10, 2)).toBe(8);
    expect(inventoryStatus(0, 5)).toBe("CRITICAL");
    expect(inventoryStatus(4, 5)).toBe("LOW");
    expect(inventoryStatus(5, 5)).toBe("OK");
  });

  it("aplica entradas e saídas sem consumir o saldo reservado", () => {
    expect(movementDelta("INBOUND", 4)).toBe(4);
    expect(movementDelta("OUTBOUND", 4)).toBe(-4);
    expect(assertResultingBalance(10, 3, -7)).toBe(3);
    expect(() => assertResultingBalance(10, 3, -8)).toThrowError(/insuficiente/i);
  });

  it("aceita ajuste assinado e rejeita saída negativa", () => {
    expect(movementDelta("ADJUSTMENT", -2)).toBe(-2);
    expect(() => movementDelta("OUTBOUND", -2)).toThrowError(/positiva/i);
  });
});
