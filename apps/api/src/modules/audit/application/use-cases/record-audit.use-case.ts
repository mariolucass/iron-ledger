import type { DomainEvent } from "../../../../infra/messaging/rabbitmq.client";
import type { AuditAction, NewAuditLog } from "../../domain/entities/audit-log.entity";
import type { AuditRepository } from "../../domain/repositories/audit.repository";

const text = (value: unknown): string | undefined => typeof value === "string" && value.length > 0 ? value : undefined;

function actionFor(event: DomainEvent): AuditAction {
  const explicit = text(event.payload.action);
  if (explicit && ["CREATE", "UPDATE", "DELETE", "LOGIN", "PERMISSION_CHANGE"].includes(explicit)) {
    return explicit as AuditAction;
  }
  if (/created$/i.test(event.eventName)) return "CREATE";
  if (/deleted$/i.test(event.eventName)) return "DELETE";
  if (/login/i.test(event.eventName)) return "LOGIN";
  return "UPDATE";
}

export class RecordAuditUseCase {
  constructor(private readonly audit: AuditRepository) {}

  execute(event: DomainEvent) {
    const entityType = text(event.payload.entityType) ?? event.eventName.split(".")[0] ?? "System";
    const entityId = text(event.payload.entityId) ?? event.aggregateId ?? event.eventId;
    const entry: NewAuditLog = {
      eventId: event.eventId,
      eventName: event.eventName,
      occurredAt: event.occurredAt,
      actorId: event.actorId ?? null,
      entityType,
      entityId,
      action: actionFor(event),
      correlationId: text(event.payload.correlationId) ?? null,
      payload: event.payload,
    };
    return this.audit.createIfAbsent(entry);
  }
}
