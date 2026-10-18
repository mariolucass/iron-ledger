import type { DomainEvent } from "@iron-ledger/shared-types";
import { DOMAIN_EXCHANGE, matchesBinding, routingKeyFor } from "./routing";
import type { EventBus, EventHandler, SubscribeOptions } from "./types";

/**
 * Implementação síncrona para testes e desenvolvimento sem broker. Mantém a
 * semântica de fila por consumidor: cada `queue` recebe sua própria cópia.
 */
export class InMemoryEventBus implements EventBus {
  readonly exchange = DOMAIN_EXCHANGE;
  readonly published: DomainEvent[] = [];
  readonly deadLetters: Array<{ queue: string; event: DomainEvent; error: unknown }> = [];
  private readonly subscriptions: Array<{ options: SubscribeOptions; handler: EventHandler }> = [];

  async publish(event: DomainEvent): Promise<void> {
    this.published.push(event);
    const routingKey = routingKeyFor(event.eventName);
    for (const { options, handler } of this.subscriptions) {
      if (!matchesBinding(options.bindingKey, routingKey)) continue;
      const maxAttempts = options.maxAttempts ?? 5;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          await handler(event, { attempt, routingKey, redelivered: attempt > 1 });
          break;
        } catch (error) {
          if (attempt === maxAttempts)
            this.deadLetters.push({ queue: options.queue, event, error });
        }
      }
    }
  }

  async subscribe(options: SubscribeOptions, handler: EventHandler): Promise<void> {
    this.subscriptions.push({ options, handler });
  }

  async close(): Promise<void> {
    this.subscriptions.length = 0;
  }
}
