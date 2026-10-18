import type { PrismaClient } from "@prisma/client";
import type { DomainEvent, EventPublisher } from "@iron-ledger/event-bus";
import type { Logger } from "@iron-ledger/logger";

export interface OutboxRelayOptions {
  /** Intervalo de varredura quando não há sinal de novos eventos. */
  pollIntervalMs?: number;
  batchSize?: number;
  /** Tempo de posse de um lote; após expirar, outra instância pode reivindicá-lo. */
  lockSeconds?: number;
  maxAttempts?: number;
}

type ClaimedRow = {
  id: string;
  aggregate_type: string;
  aggregate_id: string;
  event_name: string;
  event_version: number;
  payload: Record<string, unknown>;
  headers: { producer?: string | null; actorId?: string | null } | null;
  correlation_id: string | null;
  causation_id: string | null;
  occurred_at: Date;
  attempts: number;
  sequence: bigint;
};

/**
 * Publica eventos pendentes do outbox no barramento.
 *
 * - Reivindica lotes com `FOR UPDATE SKIP LOCKED`: várias instâncias da API
 *   podem rodar o relay sem publicar o mesmo evento em paralelo.
 * - Só marca `PUBLISHED` após o ack do broker (publisher confirms).
 * - Falhas aplicam backoff exponencial; ao esgotar, o evento vai para `DEAD_LETTER`.
 * - Entrega at-least-once: consumidores deduplicam por `eventId`.
 */
export class OutboxRelay {
  private timer?: NodeJS.Timeout;
  private running?: Promise<void>;
  private stopped = true;
  private readonly pollIntervalMs: number;
  private readonly batchSize: number;
  private readonly lockSeconds: number;
  private readonly maxAttempts: number;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly publisher: EventPublisher,
    private readonly logger: Logger,
    options: OutboxRelayOptions = {},
  ) {
    this.pollIntervalMs = options.pollIntervalMs ?? 1_000;
    this.batchSize = options.batchSize ?? 50;
    this.lockSeconds = options.lockSeconds ?? 30;
    this.maxAttempts = options.maxAttempts ?? 10;
  }

  start(): void {
    if (!this.stopped) return;
    this.stopped = false;
    this.schedule(0);
  }

  /** Antecipa a próxima varredura (chamado após um commit que gravou eventos). */
  wake(): void {
    if (this.stopped || this.running) return;
    this.schedule(0);
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    await this.running;
  }

  /** Executa uma varredura; retorna quantos eventos foram publicados. */
  async drain(): Promise<number> {
    const rows = await this.claim();
    let published = 0;
    for (const [index, row] of rows.entries()) {
      try {
        await this.publisher.publish(this.toEvent(row));
        await this.prisma.outboxEvent.update({
          where: { id: row.id },
          data: { status: "PUBLISHED", publishedAt: new Date(), lockedUntil: null, lastError: null },
        });
        published++;
      } catch (error) {
        await this.markFailed(row, error);
        // O broker provavelmente está indisponível: devolve o restante do lote sem gastar tentativas.
        const remaining = rows.slice(index + 1).map(({ id }) => id);
        if (remaining.length > 0) {
          await this.prisma.outboxEvent.updateMany({
            where: { id: { in: remaining } },
            data: { status: "PENDING", lockedUntil: null, attempts: { decrement: 1 } },
          });
        }
        break;
      }
    }
    return published;
  }

  private schedule(delayMs: number): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.running = this.drain()
        .then((published) => {
          if (published > 0) this.logger.debug({ published }, "Eventos do outbox publicados");
          return published;
        })
        .catch((error) => {
          this.logger.error({ err: error }, "Falha na varredura do outbox");
          return 0;
        })
        .then((published) => {
          this.running = undefined;
          // Lote cheio indica fila acumulada: continua imediatamente.
          if (!this.stopped) this.schedule(published >= this.batchSize ? 0 : this.pollIntervalMs);
        });
    }, delayMs);
    this.timer.unref?.();
  }

  private claim(): Promise<ClaimedRow[]> {
    // Colunas TIMESTAMP(3) guardam UTC; NOW() AT TIME ZONE 'UTC' evita depender do fuso da sessão.
    return this.prisma.$queryRaw<ClaimedRow[]>`
      UPDATE "platform"."outbox_events" AS o
      SET status = 'PUBLISHING'::"platform"."OutboxStatus",
          locked_until = (NOW() AT TIME ZONE 'UTC') + make_interval(secs => ${this.lockSeconds}),
          attempts = o.attempts + 1
      WHERE o.id IN (
        SELECT id FROM "platform"."outbox_events"
        WHERE (status IN ('PENDING', 'FAILED') AND available_at <= (NOW() AT TIME ZONE 'UTC'))
           OR (status = 'PUBLISHING' AND locked_until < (NOW() AT TIME ZONE 'UTC'))
        ORDER BY sequence
        LIMIT ${this.batchSize}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING o.id, o.aggregate_type, o.aggregate_id, o.event_name, o.event_version, o.payload,
                o.headers, o.correlation_id, o.causation_id, o.occurred_at, o.attempts, o.sequence`
      // RETURNING não preserva a ordem do subselect.
      .then((rows) => [...rows].sort((a, b) => (a.sequence < b.sequence ? -1 : a.sequence > b.sequence ? 1 : 0)));
  }

  private async markFailed(row: ClaimedRow, error: unknown): Promise<void> {
    const deadLetter = row.attempts >= this.maxAttempts;
    const backoffMs = Math.min(5 * 60_000, 1_000 * 2 ** Math.min(row.attempts, 16));
    const message = error instanceof Error ? error.message : String(error);
    this.logger[deadLetter ? "error" : "warn"](
      { err: error, eventId: row.id, eventName: row.event_name, attempts: row.attempts },
      deadLetter ? "Evento do outbox movido para DEAD_LETTER" : "Falha ao publicar evento do outbox",
    );
    await this.prisma.outboxEvent.update({
      where: { id: row.id },
      data: {
        status: deadLetter ? "DEAD_LETTER" : "FAILED",
        lastError: message.slice(0, 2_000),
        lockedUntil: null,
        availableAt: new Date(Date.now() + backoffMs),
      },
    });
  }

  private toEvent(row: ClaimedRow): DomainEvent {
    return {
      eventId: row.id,
      eventName: row.event_name,
      eventVersion: row.event_version,
      occurredAt: new Date(row.occurred_at).toISOString(),
      producer: row.headers?.producer ?? undefined,
      aggregateType: row.aggregate_type,
      aggregateId: row.aggregate_id,
      correlationId: row.correlation_id ?? undefined,
      causationId: row.causation_id ?? undefined,
      actorId: row.headers?.actorId ?? undefined,
      payload: row.payload,
    };
  }
}
