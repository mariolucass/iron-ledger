import type { TransactionStatus, TransactionType } from "../dtos/transaction";
import type { AuditablePayload, EventEnvelope } from "./envelope";

type TransactionPayload = AuditablePayload & {
  transactionId: string;
  code: string;
  type: TransactionType;
  status: TransactionStatus;
  workflowId: string;
};

export type TransactionStartedPayload = TransactionPayload & {
  items: Array<{ productId: string; warehouseId: string; sku: string; quantity: number }>;
};

export type TransactionCompletedPayload = TransactionPayload & {
  reservationId: string;
  movementId: string;
};

export type TransactionCompensatedPayload = TransactionPayload & {
  reservationId: string;
  reason: string;
};

export type TransactionFailedPayload = TransactionPayload & {
  reason: string;
  failureCode?: string;
};

export type TransactionCancelledPayload = TransactionPayload & {
  reason: string;
};

export type TransactionStarted = EventEnvelope<"Transaction.TransactionStarted", TransactionStartedPayload>;
export type TransactionCompleted = EventEnvelope<"Transaction.TransactionCompleted", TransactionCompletedPayload>;
export type TransactionCompensated = EventEnvelope<"Transaction.TransactionCompensated", TransactionCompensatedPayload>;
export type TransactionFailed = EventEnvelope<"Transaction.TransactionFailed", TransactionFailedPayload>;
export type TransactionCancelled = EventEnvelope<"Transaction.TransactionCancelled", TransactionCancelledPayload>;

export type TransactionEvent =
  | TransactionStarted
  | TransactionCompleted
  | TransactionCompensated
  | TransactionFailed
  | TransactionCancelled;

export type TransactionEventName = TransactionEvent["eventName"];
