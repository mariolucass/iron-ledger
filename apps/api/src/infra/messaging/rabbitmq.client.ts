import { RabbitMqEventBus } from "@iron-ledger/event-bus";
import { logger } from "../logger";

export type { DomainEvent, EventBus, EventPublisher } from "@iron-ledger/event-bus";

/** Nome do produtor gravado no envelope dos eventos emitidos pela API. */
export const EVENT_PRODUCER = "api";

export function createRabbitMqEventBus(url: string): RabbitMqEventBus {
  return new RabbitMqEventBus({
    url,
    connectionName: "iron-ledger-api",
    logger: logger.child({ component: "event-bus" }),
  });
}
