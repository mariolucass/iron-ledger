import amqp, { type Channel, type ChannelModel } from "amqplib";

export type DomainEvent = {
  eventId: string;
  eventName: string;
  occurredAt: string;
  aggregateId?: string;
  actorId?: string;
  payload: Record<string, unknown>;
};

export class RabbitMqClient {
  private connection?: ChannelModel;
  private channel?: Channel;
  readonly exchange = "iron-ledger.domain";

  constructor(private readonly url: string) {}

  async connect(): Promise<void> {
    this.connection = await amqp.connect(this.url);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(this.exchange, "topic", { durable: true });
  }

  async publish(event: DomainEvent): Promise<void> {
    if (!this.channel) throw new Error("RabbitMQ não conectado");
    const routingKey = event.eventName.replace(/([a-z])([A-Z])/g, "$1.$2").toLowerCase();
    const accepted = this.channel.publish(
      this.exchange,
      routingKey,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, contentType: "application/json", messageId: event.eventId },
    );
    if (!accepted) await new Promise<void>((resolve) => this.channel?.once("drain", resolve));
  }

  async subscribe(
    queue: string,
    bindingKey: string,
    handler: (event: DomainEvent) => Promise<void>,
  ): Promise<void> {
    if (!this.channel) throw new Error("RabbitMQ não conectado");
    const channel = this.channel;
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, this.exchange, bindingKey);
    await channel.prefetch(10);
    await channel.consume(queue, (message) => {
      if (!message) return;
      let event: DomainEvent;
      try {
        event = JSON.parse(message.content.toString("utf8")) as DomainEvent;
        if (!event.eventId || !event.eventName || !event.occurredAt || !event.payload) {
          throw new Error("Evento de domínio inválido");
        }
      } catch (error) {
        console.error("Evento inválido descartado da fila", error);
        channel.ack(message);
        return;
      }

      void handler(event)
        .then(() => channel.ack(message))
        .catch((error) => {
          console.error(`Falha ao consumir ${event.eventName}`, error);
          channel.nack(message, false, true);
        });
    });
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
    this.channel = undefined;
    this.connection = undefined;
  }
}
