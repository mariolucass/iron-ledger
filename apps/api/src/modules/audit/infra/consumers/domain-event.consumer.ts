import { runWithContext } from "@iron-ledger/logger";
import type { EventBus } from "../../../../infra/messaging/rabbitmq.client";
import type { RecordAuditUseCase } from "../../application/use-cases/record-audit.use-case";

/** Fila própria do contexto de auditoria; recebe uma cópia de todo evento de domínio. */
export const AUDIT_QUEUE = "iron-ledger.audit";

export async function startDomainEventConsumer(
  eventBus: Pick<EventBus, "subscribe">,
  recordAudit: RecordAuditUseCase,
): Promise<void> {
  await eventBus.subscribe({ queue: AUDIT_QUEUE, bindingKey: "#", maxAttempts: 8 }, (event) =>
    runWithContext({ correlationId: event.correlationId, eventId: event.eventId }, () =>
      recordAudit.execute(event).then(() => undefined)));
}
