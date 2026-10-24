import { InMemoryEventBus, RabbitMqEventBus } from "@iron-ledger/event-bus";
import { logger } from "../logger";

import type { EventBus } from "@iron-ledger/event-bus";

type ConnectableEventBus = EventBus & { connect(): Promise<void> };

export type { DomainEvent, EventBus, EventPublisher } from "@iron-ledger/event-bus";

export { EVENT_PRODUCER } from "../../shared/domain/domain-event";

export function createRabbitMqEventBus(url: string): RabbitMqEventBus {
  return new RabbitMqEventBus({
    url,
    connectionName: "iron-ledger-api",
    logger: logger.child({ component: "event-bus" }),
  });
}

/**
 * `memory` dispensa o broker (login, telas, testes manuais). Eventos só chegam a
 * consumidores do mesmo processo e não sobrevivem a reinício.
 */
export function createEventBus(driver: "rabbitmq" | "memory", url?: string): ConnectableEventBus {
  if (driver === "memory") return new InMemoryEventBus();
  if (!url) throw new Error("RABBITMQ_URL é obrigatória com EVENT_BUS=rabbitmq.");
  return createRabbitMqEventBus(url);
}
