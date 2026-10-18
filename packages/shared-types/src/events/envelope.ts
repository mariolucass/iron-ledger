/**
 * Envelope comum a todo evento de domínio/integração (docs/architecture/event-flow.md §4).
 *
 * Os campos opcionais existem para manter compatibilidade com eventos já gravados
 * na auditoria; produtores novos devem preencher `eventVersion`, `producer` e
 * `correlationId`.
 */
export type EventEnvelope<
  TName extends string = string,
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> = {
  /** Identificador da ocorrência; consumidores deduplicam por ele. */
  eventId: string;
  /** `<Contexto>.<Assunto><Fato>`, ex.: `Transaction.TransactionCompleted`. */
  eventName: TName;
  eventVersion?: number;
  occurredAt: string;
  /** Serviço que emitiu o fato (`api`, `temporal-worker`, `analytics`). */
  producer?: string;
  aggregateType?: string;
  aggregateId?: string;
  correlationId?: string;
  causationId?: string;
  actorId?: string;
  payload: TPayload;
};

/** Evento sem contrato específico, como recebido de uma fila. */
export type DomainEvent = EventEnvelope<string, Record<string, unknown>>;

/** Campos de auditoria que todo payload de domínio carrega. */
export type AuditablePayload = {
  entityType: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "PERMISSION_CHANGE";
};
