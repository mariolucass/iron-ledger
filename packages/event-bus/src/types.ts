import type { DomainEvent } from "@iron-ledger/shared-types";

export type { DomainEvent };

export interface EventPublisher {
  /** Resolve somente após o broker confirmar a persistência da mensagem. */
  publish(event: DomainEvent): Promise<void>;
}

export interface MessageContext {
  /** Tentativa atual, começando em 1. */
  attempt: number;
  routingKey: string;
  redelivered: boolean;
}

export type EventHandler = (event: DomainEvent, context: MessageContext) => Promise<void>;

export interface SubscribeOptions {
  /** Fila durável do consumidor lógico (cada consumidor possui a sua). */
  queue: string;
  /** Binding do tópico, ex.: `#`, `inventory.stock.*`. */
  bindingKey: string;
  prefetch?: number;
  /** Tentativas antes de enviar para `<queue>.dead-letter`. */
  maxAttempts?: number;
}

export interface EventSubscriber {
  subscribe(options: SubscribeOptions, handler: EventHandler): Promise<void>;
}

export interface EventBus extends EventPublisher, EventSubscriber {
  readonly exchange: string;
  close(): Promise<void>;
}

/** Subconjunto compatível com pino/console, para não acoplar o pacote a um logger. */
export interface EventBusLogger {
  info(object: object, message?: string): void;
  warn(object: object, message?: string): void;
  error(object: object, message?: string): void;
}
