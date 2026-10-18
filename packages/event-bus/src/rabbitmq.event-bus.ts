import amqp, { type ChannelModel, type ConfirmChannel, type ConsumeMessage } from "amqplib";
import type { DomainEvent } from "@iron-ledger/shared-types";
import { DOMAIN_EXCHANGE, isDomainEvent, routingKeyFor } from "./routing";
import type { EventBus, EventBusLogger, EventHandler, SubscribeOptions } from "./types";

const ATTEMPT_HEADER = "x-iron-ledger-attempt";

export interface RabbitMqEventBusOptions {
  url: string;
  exchange?: string;
  logger?: EventBusLogger;
  /** Nome exibido no painel do RabbitMQ. */
  connectionName?: string;
}

/**
 * EventBus sobre um exchange `topic` durável.
 *
 * - Publicação via ConfirmChannel: `publish` só resolve com ack do broker.
 * - Consumo at-least-once: o handler deve ser idempotente (deduplicar por eventId).
 * - Falhas são republicadas na própria fila com contador de tentativas; ao
 *   esgotar, a mensagem vai para `<queue>.dead-letter`. Nenhum argumento de fila
 *   é exigido, então filas já existentes continuam compatíveis.
 */
export class RabbitMqEventBus implements EventBus {
  readonly exchange: string;
  private connection?: ChannelModel;
  private channel?: ConfirmChannel;
  private readonly logger: EventBusLogger;

  constructor(private readonly options: RabbitMqEventBusOptions) {
    this.exchange = options.exchange ?? DOMAIN_EXCHANGE;
    this.logger = options.logger ?? console;
  }

  async connect(): Promise<void> {
    this.connection = await amqp.connect(this.options.url, {
      clientProperties: { connection_name: this.options.connectionName ?? "iron-ledger" },
    });
    this.connection.on("error", (error) =>
      this.logger.error({ err: error }, "Conexão RabbitMQ com erro"),
    );
    this.connection.on("close", () => this.logger.warn({}, "Conexão RabbitMQ encerrada"));
    this.channel = await this.connection.createConfirmChannel();
    await this.channel.assertExchange(this.exchange, "topic", { durable: true });
  }

  get isConnected(): boolean {
    return !!this.channel;
  }

  async publish(event: DomainEvent): Promise<void> {
    const channel = this.requireChannel();
    const routingKey = routingKeyFor(event.eventName);
    await new Promise<void>((resolve, reject) => {
      channel.publish(
        this.exchange,
        routingKey,
        Buffer.from(JSON.stringify(event)),
        {
          persistent: true,
          contentType: "application/json",
          messageId: event.eventId,
          type: event.eventName,
          timestamp: Math.floor(Date.parse(event.occurredAt) / 1000) || undefined,
          correlationId: event.correlationId,
          appId: event.producer,
        },
        (error) => (error ? reject(error) : resolve()),
      );
    });
  }

  async subscribe(options: SubscribeOptions, handler: EventHandler): Promise<void> {
    const channel = this.requireChannel();
    const maxAttempts = options.maxAttempts ?? 5;
    const deadLetterQueue = `${options.queue}.dead-letter`;
    await channel.assertQueue(options.queue, { durable: true });
    await channel.assertQueue(deadLetterQueue, { durable: true });
    await channel.bindQueue(options.queue, this.exchange, options.bindingKey);
    await channel.prefetch(options.prefetch ?? 10);

    await channel.consume(options.queue, (message) => {
      if (!message) return;
      void this.handle(channel, message, handler, { ...options, maxAttempts, deadLetterQueue });
    });
  }

  private async handle(
    channel: ConfirmChannel,
    message: ConsumeMessage,
    handler: EventHandler,
    options: SubscribeOptions & { maxAttempts: number; deadLetterQueue: string },
  ): Promise<void> {
    const attempt = Number(message.properties.headers?.[ATTEMPT_HEADER] ?? 1);
    let event: unknown;
    try {
      event = JSON.parse(message.content.toString("utf8"));
    } catch {
      event = undefined;
    }
    if (!isDomainEvent(event)) {
      this.logger.error(
        { queue: options.queue, messageId: message.properties.messageId },
        "Mensagem inválida enviada para dead-letter",
      );
      channel.sendToQueue(options.deadLetterQueue, message.content, {
        ...message.properties,
        persistent: true,
      });
      channel.ack(message);
      return;
    }

    try {
      await handler(event, {
        attempt,
        routingKey: message.fields.routingKey,
        redelivered: message.fields.redelivered,
      });
      channel.ack(message);
    } catch (error) {
      const exhausted = attempt >= options.maxAttempts;
      const target = exhausted ? options.deadLetterQueue : options.queue;
      this.logger[exhausted ? "error" : "warn"](
        {
          err: error,
          queue: options.queue,
          eventId: event.eventId,
          eventName: event.eventName,
          attempt,
        },
        exhausted
          ? "Evento enviado para dead-letter após esgotar tentativas"
          : "Falha ao consumir evento; nova tentativa agendada",
      );
      channel.sendToQueue(target, message.content, {
        ...message.properties,
        persistent: true,
        headers: {
          ...message.properties.headers,
          [ATTEMPT_HEADER]: attempt + 1,
          "x-last-error": String((error as Error)?.message ?? error),
        },
      });
      channel.ack(message);
    }
  }

  async close(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
    this.channel = undefined;
    this.connection = undefined;
  }

  private requireChannel(): ConfirmChannel {
    if (!this.channel) throw new Error("RabbitMQ não conectado.");
    return this.channel;
  }
}
