import { ValidationError } from "../../../../shared/errors/validation.error";

export const STOCK_MOVEMENT_TYPES = ["INBOUND", "OUTBOUND", "ADJUSTMENT", "RETURN"] as const;

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

/**
 * Variação do saldo físico causada por uma movimentação. Só o ajuste aceita
 * quantidade negativa; a saída informa a quantidade positiva e debita.
 */
export function movementDelta(type: StockMovementType, quantity: number): number {
  if (!Number.isFinite(quantity) || quantity === 0) {
    throw new ValidationError("A quantidade da movimentação deve ser diferente de zero.");
  }
  if (type !== "ADJUSTMENT" && quantity < 0) {
    throw new ValidationError("A quantidade deve ser positiva para este tipo de movimentação.");
  }
  return type === "OUTBOUND" ? -quantity : quantity;
}
