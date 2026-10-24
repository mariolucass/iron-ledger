import { createEvent } from "@iron-ledger/event-bus";
import type {
  TransactionCancelled,
  TransactionCompensated,
  TransactionCompleted,
  TransactionEvent,
  TransactionFailed,
  TransactionStarted,
} from "@iron-ledger/shared-types";
import { EVENT_PRODUCER } from "../../../../shared/domain/domain-event";
import type { TransactionSnapshot } from "../entities/transaction.entity";

const AGGREGATE_TYPE = "Transaction";

function base(transaction: TransactionSnapshot, now: Date, actorId: string | null) {
  return {
    producer: EVENT_PRODUCER,
    occurredAt: now,
    aggregateType: AGGREGATE_TYPE,
    aggregateId: transaction.id,
    correlationId: transaction.correlationId ?? undefined,
    actorId: actorId ?? undefined,
  };
}

function payload(transaction: TransactionSnapshot, action: "CREATE" | "UPDATE") {
  return {
    entityType: AGGREGATE_TYPE,
    entityId: transaction.id,
    action,
    transactionId: transaction.id,
    code: transaction.code,
    type: transaction.type,
    status: transaction.status,
    workflowId: transaction.workflowId,
  };
}

export function transactionStarted(
  transaction: TransactionSnapshot,
  now: Date,
): TransactionStarted {
  return createEvent({
    ...base(transaction, now, transaction.initiatedBy),
    eventName: "Transaction.TransactionStarted",
    payload: {
      ...payload(transaction, "CREATE"),
      items: transaction.items.map(({ productId, warehouseId, sku, quantity }) => ({
        productId,
        warehouseId,
        sku,
        quantity,
      })),
    },
  });
}

export function transactionCompleted(
  transaction: TransactionSnapshot,
  result: { reservationId: string; movementId: string },
  now: Date,
  actorId: string | null,
): TransactionCompleted {
  return createEvent({
    ...base(transaction, now, actorId),
    eventName: "Transaction.TransactionCompleted",
    payload: { ...payload(transaction, "UPDATE"), ...result },
  });
}

export function transactionCompensated(
  transaction: TransactionSnapshot,
  result: { reservationId: string; reason: string },
  now: Date,
  actorId: string | null,
): TransactionCompensated {
  return createEvent({
    ...base(transaction, now, actorId),
    eventName: "Transaction.TransactionCompensated",
    payload: { ...payload(transaction, "UPDATE"), ...result },
  });
}

export function transactionFailed(
  transaction: TransactionSnapshot,
  reason: string,
  failureCode: string | undefined,
  now: Date,
  actorId: string | null,
): TransactionFailed {
  return createEvent({
    ...base(transaction, now, actorId),
    eventName: "Transaction.TransactionFailed",
    payload: { ...payload(transaction, "UPDATE"), reason, failureCode },
  });
}

export function transactionCancelled(
  transaction: TransactionSnapshot,
  reason: string,
  now: Date,
  actorId: string | null,
): TransactionCancelled {
  return createEvent({
    ...base(transaction, now, actorId),
    eventName: "Transaction.TransactionCancelled",
    payload: { ...payload(transaction, "UPDATE"), reason },
  });
}

export type { TransactionEvent };
