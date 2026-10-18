/** Type-only boundary. No Temporal SDK, HTTP client or server implementation belongs here. */
export interface TransactionSagaInput {
  transactionId: string;
  stockLevelId: string;
  quantity: number;
  failConfirmation: boolean;
  /** Propagated to every activity call; absent in histories started before lifecycle tracking. */
  correlationId?: string;
}

export type TransactionSagaResult =
  | { status: "COMPLETED"; reservationId: string; movementId: string }
  | { status: "COMPENSATED"; reservationId: string; reason: string };

/** Read model used to resolve uncertain HTTP outcomes without repeating stock changes. */
export type ReservationSnapshot =
  | { status: "NOT_FOUND" }
  | { status: "ACTIVE" | "RELEASED" | "EXPIRED"; reservationId: string }
  | { status: "COMMITTED"; reservationId: string; movementId: string };

/** Stable step identifiers; they are persisted and rendered by the web timeline. */
export type SagaStepName =
  | "reserveStock"
  | "confirmTransaction"
  | "reconcileReservation"
  | "compensateStock";

export type SagaStepKind = "ACTION" | "COMPENSATION";

export type RecordedSagaStepStatus = "RUNNING" | "SUCCEEDED" | "FAILED";

/**
 * Worker → API: progress of one saga step. `sequence` is assigned
 * deterministically by the workflow, so repeated deliveries are idempotent upserts.
 */
export interface RecordSagaStepInput {
  transactionId: string;
  sequence: number;
  name: SagaStepName;
  kind: SagaStepKind;
  status: RecordedSagaStepStatus;
  startedAt: string;
  finishedAt?: string;
  error?: string;
  output?: Record<string, string | number | boolean | null>;
}

/** Final business outcome reported by the workflow to the transaction context. */
export type TransactionOutcome =
  | TransactionSagaResult
  | { status: "FAILED"; reason: string; failureCode?: string }
  | { status: "CANCELLED"; reason: string };

export interface ReportTransactionOutcomeInput {
  transactionId: string;
  outcome: TransactionOutcome;
}
