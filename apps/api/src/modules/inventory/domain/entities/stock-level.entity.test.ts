import { describe, expect, it } from "vitest";
import { Quantity } from "../value-objects/quantity.vo";
import { StockLevel } from "./stock-level.entity";
import { movementDelta } from "./stock-movement.entity";

describe("StockLevel", () => {
  it("calcula saldo disponível e classificação", () => {
    expect(new StockLevel(10, 2).available).toBe(8);
    expect(new StockLevel(0, 0).status(5)).toBe("CRITICAL");
    expect(new StockLevel(4, 0).status(5)).toBe("LOW");
    expect(new StockLevel(5, 0).status(5)).toBe("OK");
  });

  it("aplica entradas e saídas sem consumir o saldo reservado", () => {
    expect(movementDelta("INBOUND", 4)).toBe(4);
    expect(movementDelta("OUTBOUND", 4)).toBe(-4);
    expect(new StockLevel(10, 3).applyMovement("OUTBOUND", 7)).toBe(3);
    expect(() => new StockLevel(10, 3).applyMovement("OUTBOUND", 8)).toThrowError(/insuficiente/i);
  });

  it("aceita ajuste assinado e rejeita saída negativa", () => {
    expect(movementDelta("ADJUSTMENT", -2)).toBe(-2);
    expect(() => movementDelta("OUTBOUND", -2)).toThrowError(/positiva/i);
  });

  it("reserva apenas o disponível", () => {
    expect(() => new StockLevel(10, 4).assertCanReserve(Quantity.positive(6))).not.toThrow();
    expect(() => new StockLevel(10, 4).assertCanReserve(Quantity.positive(7))).toThrowError(
      /insuficiente/i,
    );
  });

  it("rejeita liberar ou confirmar mais do que está reservado", () => {
    expect(() => new StockLevel(10, 2).assertCanRelease(Quantity.positive(3))).toThrowError(
      expect.objectContaining({ code: "RESERVATION_BALANCE_CONFLICT" }),
    );
    expect(() => new StockLevel(2, 5).assertCanCommit(Quantity.positive(3))).toThrowError(
      expect.objectContaining({ code: "RESERVATION_BALANCE_CONFLICT" }),
    );
    expect(() => new StockLevel(5, 3).assertCanCommit(Quantity.positive(3))).not.toThrow();
  });
});

describe("Quantity", () => {
  it("aceita apenas valores positivos e compara pelo valor", () => {
    expect(() => Quantity.positive(0)).toThrowError(/positiva/i);
    expect(() => Quantity.positive(Number.NaN)).toThrowError(/positiva/i);
    expect(Quantity.positive(2).equals(Quantity.positive(2))).toBe(true);
    expect(Quantity.positive(2).equals(Quantity.positive(3))).toBe(false);
  });
});
