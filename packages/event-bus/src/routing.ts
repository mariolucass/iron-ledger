import { randomUUID } from "node:crypto";
import type { DomainEvent, EventEnvelope } from "@iron-ledger/shared-types";

export const DOMAIN_EXCHANGE = "iron-ledger.domain";

/** `Inventory.StockUpdated` → `inventory.stock.updated`. */
export function routingKeyFor(eventName: string): string {
  return eventName.replace(/([a-z0-9])([A-Z])/g, "$1.$2").toLowerCase();
}

/** Semântica de tópico AMQP: `*` casa uma palavra e `#` casa zero ou mais. */
export function matchesBinding(bindingKey: string, routingKey: string): boolean {
  const pattern = bindingKey.split(".");
  const words = routingKey.split(".");
  const match = (p: number, w: number): boolean => {
    if (p === pattern.length) return w === words.length;
    const token = pattern[p];
    if (token === "#") {
      for (let next = w; next <= words.length; next++) if (match(p + 1, next)) return true;
      return false;
    }
    if (w === words.length) return false;
    return (token === "*" || token === words[w]) && match(p + 1, w + 1);
  };
  return match(0, 0);
}

export interface CreateEventInput<TName extends string, TPayload extends Record<string, unknown>> {
  eventName: TName;
  payload: TPayload;
  producer: string;
  eventId?: string;
  eventVersion?: number;
  occurredAt?: Date;
  aggregateType?: string;
  aggregateId?: string;
  correlationId?: string;
  causationId?: string;
  actorId?: string;
}

/** Monta o envelope padronizado; `eventId` estável permite deduplicação. */
export function createEvent<TName extends string, TPayload extends Record<string, unknown>>(
  input: CreateEventInput<TName, TPayload>,
): EventEnvelope<TName, TPayload> {
  return {
    eventId: input.eventId ?? randomUUID(),
    eventName: input.eventName,
    eventVersion: input.eventVersion ?? 1,
    occurredAt: (input.occurredAt ?? new Date()).toISOString(),
    producer: input.producer,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    actorId: input.actorId,
    payload: input.payload,
  };
}

/** Validação estrutural mínima de uma mensagem recebida. */
export function isDomainEvent(value: unknown): value is DomainEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Record<string, unknown>;
  return (
    typeof event.eventId === "string" &&
    event.eventId.length > 0 &&
    typeof event.eventName === "string" &&
    event.eventName.length > 0 &&
    typeof event.occurredAt === "string" &&
    !!event.payload &&
    typeof event.payload === "object" &&
    !Array.isArray(event.payload)
  );
}
