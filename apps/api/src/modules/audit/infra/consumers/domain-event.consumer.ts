import type { RabbitMqClient } from "../../../../infra/messaging/rabbitmq.client";
import type { RecordAuditUseCase } from "../../application/use-cases/record-audit.use-case";

export async function startDomainEventConsumer(
  rabbitMq: RabbitMqClient,
  recordAudit: RecordAuditUseCase,
): Promise<void> {
  await rabbitMq.subscribe("iron-ledger.audit", "#", (event) => recordAudit.execute(event).then(() => undefined));
}
