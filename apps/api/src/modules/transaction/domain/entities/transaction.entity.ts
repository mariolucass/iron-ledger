import { randomUUID } from "node:crypto";
import type { TransactionEvent, TransactionItemStatus, TransactionType } from "@iron-ledger/shared-types";
import type { TransactionOutcome } from "@iron-ledger/workflow-contracts";
import { AppError } from "../../../../shared/errors/domain.error";
import {
  transactionCancelled,
  transactionCompensated,
  transactionCompleted,
  transactionFailed,
  transactionStarted,
} from "../events/transaction.events";
import { assertTransition, isTerminal, type TransactionStatus } from "../value-objects/transaction-status";

export interface TransactionItem {
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

export interface StatusChange {
  fromStatus: TransactionStatus | null;
  toStatus: TransactionStatus;
  reason: string | null;
  changedBy: string | null;
  changedAt: Date;
}

export interface TransactionSnapshot {
  id: string;
  code: string;
  type: TransactionType;
  status: TransactionStatus;
  workflowId: string;
  workflowRunId: string | null;
  idempotencyKey: string | null;
  correlationId: string | null;
  warehouseId: string | null;
  externalRef: string | null;
  failureCode: string | null;
  failureReason: string | null;
  initiatedBy: string;
  startedAt: Date | null;
  completedAt: Date | null;
  compensatedAt: Date | null;
  version: number;
  createdAt: Date;
  items: TransactionItem[];
}

export interface StartTransactionProps {
  code: string;
  stock: { productId: string; warehouseId: string; sku: string };
  quantity: number;
  initiatedBy: string;
  correlationId?: string;
  idempotencyKey?: string;
  externalRef?: string;
  now?: Date;
}

/**
 * Agregado Transaction: transação de negócio cuja execução é orquestrada por uma
 * Saga. Concentra as regras de transição e produz os eventos de domínio que o
 * repositório grava no outbox no mesmo commit.
 */
export class Transaction {
  private changes: StatusChange[] = [];
  private events: TransactionEvent[] = [];

  private constructor(private state: TransactionSnapshot) {}

  static start(props: StartTransactionProps): Transaction {
    if (!Number.isFinite(props.quantity) || props.quantity <= 0) {
      throw new AppError("A quantidade deve ser positiva.", 422, "VALIDATION_ERROR");
    }
    const now = props.now ?? new Date();
    const id = randomUUID();
    const transaction = new Transaction({
      id,
      code: props.code,
      type: "SALE",
      status: "PENDING",
      // A Saga usa o ID da transação; a reserva também, garantindo idempotência ponta a ponta.
      workflowId: id,
      workflowRunId: null,
      idempotencyKey: props.idempotencyKey ?? null,
      correlationId: props.correlationId ?? null,
      warehouseId: props.stock.warehouseId,
      externalRef: props.externalRef ?? null,
      failureCode: null,
      failureReason: null,
      initiatedBy: props.initiatedBy,
      startedAt: null,
      completedAt: null,
      compensatedAt: null,
      version: 0,
      createdAt: now,
      items: [{
        id: randomUUID(),
        lineNumber: 1,
        productId: props.stock.productId,
        warehouseId: props.stock.warehouseId,
        sku: props.stock.sku,
        quantity: props.quantity,
        status: "PENDING",
        reservationId: null,
        movementId: null,
      }],
    });
    transaction.changes.push({ fromStatus: null, toStatus: "PENDING", reason: "Transação criada", changedBy: props.initiatedBy, changedAt: now });
    transaction.events.push(transactionStarted(transaction.state, now));
    return transaction;
  }

  static restore(snapshot: TransactionSnapshot): Transaction {
    return new Transaction({ ...snapshot, items: snapshot.items.map((item) => ({ ...item })) });
  }

  get id(): string { return this.state.id; }
  get status(): TransactionStatus { return this.state.status; }
  get version(): number { return this.state.version; }

  snapshot(): TransactionSnapshot {
    return { ...this.state, items: this.state.items.map((item) => ({ ...item })) };
  }

  /** Chamado pelo repositório após persistir, com a nova versão. */
  committed(version: number): void {
    this.state.version = version;
    this.changes = [];
    this.events = [];
  }

  pendingChanges(): readonly StatusChange[] { return this.changes; }
  pendingEvents(): readonly TransactionEvent[] { return this.events; }

  /**
   * Marca a Saga como em execução. O worker pode reportar o primeiro passo antes
   * de a API registrar o início, por isso a operação é idempotente e o `runId`
   * pode chegar depois. Retorna se houve alteração.
   */
  markProcessing(workflowRunId: string | null, now = new Date()): boolean {
    let changed = false;
    if (this.state.status === "PENDING") {
      this.transition("PROCESSING", "Saga iniciada no Temporal", null, now);
      this.state.startedAt = now;
      changed = true;
    }
    if (workflowRunId && !this.state.workflowRunId) {
      this.state.workflowRunId = workflowRunId;
      changed = true;
    }
    return changed;
  }

  recordReservation(reservationId: string): boolean {
    let changed = false;
    for (const item of this.state.items) {
      if (item.status === "PENDING") {
        item.status = "RESERVED";
        item.reservationId = reservationId;
        changed = true;
      }
    }
    return changed;
  }

  beginCompensation(now = new Date()): boolean {
    if (this.state.status !== "PROCESSING") return false;
    this.transition("COMPENSATING", "Compensação iniciada", null, now);
    return true;
  }

  /**
   * Aplica o desfecho reportado pela Saga. Repetir o mesmo desfecho é inofensivo
   * (entrega at-least-once das activities); um desfecho divergente é conflito.
   */
  applyOutcome(outcome: TransactionOutcome, actorId: string | null, now = new Date()): boolean {
    if (isTerminal(this.state.status)) {
      if (this.state.status === outcome.status) return false;
      throw new AppError(
        `A transação já foi finalizada como ${this.state.status}.`,
        409,
        "TRANSACTION_ALREADY_FINALIZED",
      );
    }

    switch (outcome.status) {
      case "COMPLETED":
        this.transition("COMPLETED", "Saga concluída", actorId, now);
        this.state.completedAt = now;
        for (const item of this.state.items) {
          item.status = "CONFIRMED";
          item.reservationId = outcome.reservationId;
          item.movementId = outcome.movementId;
        }
        this.events.push(transactionCompleted(this.state, outcome, now, actorId));
        break;
      case "COMPENSATED":
        this.transition("COMPENSATED", outcome.reason, actorId, now);
        this.state.compensatedAt = now;
        this.state.completedAt = now;
        this.state.failureReason = outcome.reason;
        for (const item of this.state.items) {
          item.status = "RELEASED";
          item.reservationId = outcome.reservationId;
        }
        this.events.push(transactionCompensated(this.state, outcome, now, actorId));
        break;
      case "FAILED":
        this.fail(outcome.reason, outcome.failureCode, actorId, now);
        break;
      case "CANCELLED":
        this.transition("CANCELLED", outcome.reason, actorId, now);
        this.state.completedAt = now;
        this.state.failureReason = outcome.reason;
        this.events.push(transactionCancelled(this.state, outcome.reason, now, actorId));
        break;
    }
    return true;
  }

  fail(reason: string, failureCode: string | undefined, actorId: string | null, now = new Date()): void {
    this.transition("FAILED", reason, actorId, now);
    this.state.completedAt = now;
    this.state.failureReason = reason;
    this.state.failureCode = failureCode ?? null;
    for (const item of this.state.items) {
      if (item.status === "PENDING" || item.status === "RESERVED") item.status = "FAILED";
    }
    this.events.push(transactionFailed(this.state, reason, failureCode, now, actorId));
  }

  private transition(to: TransactionStatus, reason: string | null, actorId: string | null, now: Date): void {
    const from = this.state.status;
    assertTransition(from, to);
    this.state.status = to;
    this.changes.push({ fromStatus: from, toStatus: to, reason, changedBy: actorId, changedAt: now });
  }
}

/** Código legível e ordenável por data: `TXN-20261018-4F7K2Q`. */
export function generateTransactionCode(now = new Date()): string {
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `TXN-${date}-${suffix}`;
}
