import type { TransactionStatus } from "@iron-ledger/shared-types";
import { AppError } from "../../../../shared/errors/domain.error";

export type { TransactionStatus };

/**
 * Máquina de estados da transação de negócio.
 *
 *   PENDING ─► PROCESSING ─► COMPLETED
 *      │           │  └────► COMPENSATING ─► COMPENSATED
 *      │           └───────► COMPENSATED (falha antes de haver reserva ativa)
 *      └─────────► FAILED / CANCELLED (a partir de qualquer estado não terminal)
 */
const TRANSITIONS: Record<TransactionStatus, readonly TransactionStatus[]> = {
  PENDING: ["PROCESSING", "FAILED", "CANCELLED"],
  PROCESSING: ["COMPLETED", "COMPENSATING", "COMPENSATED", "FAILED", "CANCELLED"],
  COMPENSATING: ["COMPENSATED", "FAILED", "CANCELLED"],
  COMPLETED: [],
  COMPENSATED: [],
  FAILED: [],
  CANCELLED: [],
};

export function isTerminal(status: TransactionStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

export function canTransition(from: TransactionStatus, to: TransactionStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: TransactionStatus, to: TransactionStatus): void {
  if (!canTransition(from, to)) {
    throw new AppError(`Transição inválida de ${from} para ${to}.`, 409, "INVALID_TRANSACTION_TRANSITION");
  }
}
