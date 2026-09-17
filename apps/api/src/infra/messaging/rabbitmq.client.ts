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

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
    this.channel = undefined;
    this.connection = undefined;
  }
}
