import type { ConfirmChannel, ConsumeMessage } from "amqplib";
import amqp, { type AmqpConnectionManager, type ChannelWrapper } from "amqp-connection-manager";
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
  private connection?: AmqpConnectionManager;
  private publisher?: ChannelWrapper;
  private readonly consumers: ChannelWrapper[] = [];
  private readonly logger: EventBusLogger;

  constructor(private readonly options: RabbitMqEventBusOptions) {
    this.exchange = options.exchange ?? DOMAIN_EXCHANGE;
    this.logger = options.logger ?? console;
  }

  async connect(): Promise<void> {
    const connection = amqp.connect([this.options.url], {
      connectionOptions: {
        clientProperties: { connection_name: this.options.connectionName ?? "iron-ledger" },
      },
    });
    this.connection = connection;
    connection.on("error", (error) =>
      this.logger.error({ err: error }, "Conexão RabbitMQ com erro"),
    );
    connection.on("disconnect", ({ err }) => this.logger.warn({ err }, "Conexão RabbitMQ encerrada; reconectando"));
    this.publisher = connection.createChannel({
      name: "domain-events-publisher",
      publishTimeout: 10_000,
      setup: (channel: ConfirmChannel) => channel.assertExchange(this.exchange, "topic", { durable: true }).then(() => undefined),
    });
    try {
      await connection.connect({ timeout: 5_000 });
      await this.publisher.waitForConnect();
    } catch (error) {
      await this.close();
      throw error;
    }
  }

  get isConnected(): boolean {
    return this.connection?.isConnected() ?? false;
  }

  async publish(event: DomainEvent): Promise<void> {
    const publisher = this.requirePublisher();
    const routingKey = routingKeyFor(event.eventName);
    await publisher.publish(this.exchange, routingKey, Buffer.from(JSON.stringify(event)), {
      persistent: true,
      contentType: "application/json",
      messageId: event.eventId,
      type: event.eventName,
      timestamp: Math.floor(Date.parse(event.occurredAt) / 1000) || undefined,
      correlationId: event.correlationId,
      appId: event.producer,
    });
  }

  async subscribe(options: SubscribeOptions, handler: EventHandler): Promise<void> {
    const connection = this.connection;
    if (!connection) throw new Error("RabbitMQ não conectado.");
    const maxAttempts = options.maxAttempts ?? 5;
    const deadLetterQueue = `${options.queue}.dead-letter`;
    const consumer = connection.createChannel({
      name: `domain-events-${options.queue}`,
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(this.exchange, "topic", { durable: true });
        await channel.assertQueue(options.queue, { durable: true });
        await channel.assertQueue(deadLetterQueue, { durable: true });
        await channel.bindQueue(options.queue, this.exchange, options.bindingKey);
        await channel.prefetch(options.prefetch ?? 10);
        await channel.consume(options.queue, (message: ConsumeMessage | null) => {
          if (message) void this.handle(channel, message, handler, { ...options, maxAttempts, deadLetterQueue });
        });
      },
    });
    this.consumers.push(consumer);
    await consumer.waitForConnect();
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
      await this.republishThenAck(channel, message, options.deadLetterQueue, {
        ...message.properties,
        persistent: true,
      });
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
      await this.republishThenAck(channel, message, target, {
        ...message.properties,
        persistent: true,
        headers: {
          ...message.properties.headers,
          [ATTEMPT_HEADER]: attempt + 1,
          "x-last-error": String((error as Error)?.message ?? error),
        },
      });
    }
  }

  private async republishThenAck(
    channel: ConfirmChannel,
    message: ConsumeMessage,
    target: string,
    properties: Parameters<ChannelWrapper["sendToQueue"]>[2],
  ): Promise<void> {
    try {
      // Confirme a republicação antes de remover a entrega original.
      await this.requirePublisher().sendToQueue(target, message.content, properties);
      channel.ack(message);
    } catch (error) {
      this.logger.error({ err: error, target }, "Não foi possível republicar evento; entrega original será refeita");
      try { channel.nack(message, false, true); } catch { /* Canal encerrado: RabbitMQ redeliverá a entrega. */ }
    }
  }

  async close(): Promise<void> {
    await Promise.all(this.consumers.splice(0).map((channel) => channel.close().catch(() => undefined)));
    await this.publisher?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
    this.publisher = undefined;
    this.connection = undefined;
  }

  private requirePublisher(): ChannelWrapper {
    if (!this.publisher) throw new Error("RabbitMQ não conectado.");
    return this.publisher;
  }
}
