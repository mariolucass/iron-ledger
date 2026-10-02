import { AppError } from "../../../../shared/errors/domain.error";
import { ValidationError } from "../../../../shared/errors/validation.error";
import type { StockMovementType } from "../../application/dtos/update-stock.dto";

export function availableQuantity(quantity: number, reserved: number): number {
  return quantity - reserved;
}

export function inventoryStatus(available: number, minimum: number): "CRITICAL" | "LOW" | "OK" {
  if (available <= 0) return "CRITICAL";
  if (available < minimum) return "LOW";
  return "OK";
}

export function movementDelta(type: StockMovementType, quantity: number): number {
  if (!Number.isFinite(quantity) || quantity === 0) {
    throw new ValidationError("A quantidade da movimentação deve ser diferente de zero.");
  }
  if (type !== "ADJUSTMENT" && quantity < 0) {
    throw new ValidationError("A quantidade deve ser positiva para este tipo de movimentação.");
  }
  return type === "OUTBOUND" ? -quantity : quantity;
}

export function assertResultingBalance(current: number, reserved: number, delta: number): number {
  const resulting = current + delta;
  if (resulting < reserved) {
    throw new AppError("Saldo disponível insuficiente para a operação.", 409, "INSUFFICIENT_STOCK");
  }
  return resulting;
}
