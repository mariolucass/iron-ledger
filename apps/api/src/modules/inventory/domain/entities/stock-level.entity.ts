import { AppError } from "../../../../shared/errors/domain.error";
import type { Quantity } from "../value-objects/quantity.vo";
import { movementDelta, type StockMovementType } from "./stock-movement.entity";

export type StockStatus = "CRITICAL" | "LOW" | "OK";

/**
 * Saldo de um produto em um armazém. O disponível é o físico menos o reservado,
 * e nenhuma operação pode deixar o físico abaixo do que já está reservado.
 * A persistência (versão otimista, reservas, movimentos) fica no repositório.
 */
export class StockLevel {
  constructor(
    readonly quantity: number,
    readonly reserved: number,
  ) {}

  get available(): number {
    return this.quantity - this.reserved;
  }

  status(minimum: number): StockStatus {
    if (this.available <= 0) return "CRITICAL";
    if (this.available < minimum) return "LOW";
    return "OK";
  }

  /** Saldo físico resultante de uma movimentação manual. */
  applyMovement(type: StockMovementType, quantity: number): number {
    const resulting = this.quantity + movementDelta(type, quantity);
    if (resulting < this.reserved) {
      throw new AppError(
        "Saldo disponível insuficiente para a operação.",
        409,
        "INSUFFICIENT_STOCK",
      );
    }
    return resulting;
  }

  assertCanReserve(quantity: Quantity): void {
    if (this.available < quantity.toNumber()) {
      throw new AppError(
        "Saldo disponível insuficiente para a reserva.",
        409,
        "INSUFFICIENT_STOCK",
      );
    }
  }

  /** Liberar devolve a quantidade ao disponível. */
  assertCanRelease(quantity: Quantity): void {
    if (this.reserved < quantity.toNumber()) throw balanceConflict();
  }

  /** Confirmar baixa o físico e o reservado na mesma quantidade. */
  assertCanCommit(quantity: Quantity): void {
    if (this.reserved < quantity.toNumber() || this.quantity < quantity.toNumber())
      throw balanceConflict();
  }
}

const balanceConflict = () =>
  new AppError("O saldo reservado está inconsistente.", 409, "RESERVATION_BALANCE_CONFLICT");
