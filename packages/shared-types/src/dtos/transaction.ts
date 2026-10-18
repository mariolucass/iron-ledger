/** Espelha os enums do schema `transaction` (apps/api/prisma/schema/transaction). */
export type TransactionStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "COMPENSATING"
  | "COMPENSATED"
  | "FAILED"
  | "CANCELLED";

export type TransactionType = "SALE" | "PURCHASE_RECEIPT" | "TRANSFER" | "RETURN" | "ADJUSTMENT";

export type TransactionItemStatus = "PENDING" | "RESERVED" | "CONFIRMED" | "RELEASED" | "FAILED";

export type SagaStepKind = "ACTION" | "COMPENSATION";

export type SagaStepStatus =
  | "SCHEDULED"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "SKIPPED"
  | "TIMED_OUT";

export const TERMINAL_TRANSACTION_STATUSES = [
  "COMPLETED",
  "COMPENSATED",
  "FAILED",
  "CANCELLED",
] as const;

export interface StartTransactionRequestDto {
  stockLevelId: string;
  quantity: number;
  /** Referência no sistema de origem (pedido, NF-e). */
  externalRef?: string;
  /** Força falha na confirmação para demonstrar a compensação. */
  failConfirmation?: boolean;
}

export interface TransactionItemDto {
  id: string;
  lineNumber: number;
  productId: string;
  warehouseId: string;
  sku: string;
  quantity: number;
  status: TransactionItemStatus;
  reservationId: string | null;
  movementId: string | null;
}

export interface SagaStepDto {
  id: string;
  sequence: number;
  name: string;
  kind: SagaStepKind;
  status: SagaStepStatus;
  attempt: number;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
}

export interface TransactionStatusChangeDto {
  fromStatus: TransactionStatus | null;
  toStatus: TransactionStatus;
  reason: string | null;
  changedBy: string | null;
  changedAt: string;
}

export interface TransactionSummaryDto {
  id: string;
  code: string;
  type: TransactionType;
  status: TransactionStatus;
  workflowId: string;
  correlationId: string | null;
  externalRef: string | null;
  itemCount: number;
  totalQuantity: number;
  initiatedBy: string;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface TransactionDetailDto extends TransactionSummaryDto {
  workflowRunId: string | null;
  items: TransactionItemDto[];
  steps: SagaStepDto[];
  history: TransactionStatusChangeDto[];
}

export interface TransactionListQueryDto {
  status?: TransactionStatus;
  type?: TransactionType;
  code?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface TransactionListDto {
  items: TransactionSummaryDto[];
  page: number;
  pageSize: number;
  total: number;
}
