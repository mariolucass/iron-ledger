import type {
  SagaStepDto,
  SagaStepStatus,
  StartTransactionRequestDto,
  TransactionDetailDto,
  TransactionItemDto,
  TransactionListQueryDto,
  TransactionStatus,
  TransactionStatusChangeDto,
  TransactionSummaryDto,
  TransactionType,
} from "@iron-ledger/shared-types";

/** Contratos públicos do contexto `transaction` da API (packages/shared-types). */
export type {
  SagaStepStatus,
  TransactionStatus,
  TransactionType,
};
export type StartTransactionInput = StartTransactionRequestDto;
export type TransactionSummary = TransactionSummaryDto;
export type TransactionDetail = TransactionDetailDto;
export type TransactionItem = TransactionItemDto;
export type SagaStep = SagaStepDto;
export type TransactionStatusChange = TransactionStatusChangeDto;
export type TransactionQuery = TransactionListQueryDto;

const TERMINAL: readonly TransactionStatus[] = ["COMPLETED", "COMPENSATED", "FAILED", "CANCELLED"];

/** Enquanto não terminal, a tela deve continuar consultando a API. */
export function isTerminalStatus(status: TransactionStatus): boolean {
  return TERMINAL.includes(status);
}

export const TRANSACTION_STATUSES: readonly TransactionStatus[] = [
  "PENDING", "PROCESSING", "COMPENSATING", "COMPLETED", "COMPENSATED", "FAILED", "CANCELLED",
];
