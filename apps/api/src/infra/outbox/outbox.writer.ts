import type { Prisma } from "@prisma/client";
import type { DomainEvent } from "@iron-ledger/shared-types";
import { routingKeyFor } from "@iron-ledger/event-bus";

/**
 * Grava eventos no outbox usando o client da transação corrente, para que o
 * commit do estado e o registro do evento sejam atômicos (Transactional Outbox).
 *
 * O `eventId` do envelope vira a chave primária: precisa ser UUID e é o mesmo
 * identificador que os consumidores usam para deduplicar.
 */
export async function enqueueEvents(transaction: Prisma.TransactionClient, events: readonly DomainEvent[]): Promise<void> {
  if (events.length === 0) return;
  await transaction.outboxEvent.createMany({
    data: events.map((event) => ({
      id: event.eventId,
      aggregateType: event.aggregateType ?? event.eventName.split(".")[0] ?? "Unknown",
      aggregateId: event.aggregateId ?? event.eventId,
      eventName: event.eventName,
      eventVersion: event.eventVersion ?? 1,
      routingKey: routingKeyFor(event.eventName),
      payload: event.payload as Prisma.InputJsonObject,
      headers: { producer: event.producer ?? null, actorId: event.actorId ?? null },
      correlationId: event.correlationId,
      causationId: event.causationId,
      occurredAt: new Date(event.occurredAt),
    })),
  });
}
