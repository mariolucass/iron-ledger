import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { AppError } from "../../../../shared/errors/domain.error";
import { NotFoundError } from "../../../../shared/errors/not-found.error";

export type AlertStatusInput = "ACKNOWLEDGED" | "RESOLVED";

/** Persistência dos alertas operacionais armazenados no schema analytics. */
export class PrismaAlertRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createSagaFailure(
    transaction: Prisma.TransactionClient,
    input: {
      transactionId: string;
      transactionCode: string;
      workflowId: string;
      failureCode: string | null;
      failureReason: string | null;
    },
  ): Promise<void> {
    const dedupKey = `saga-failure:${input.transactionId}`;
    const title = `Falha na transação ${input.transactionCode}`;
    const message = input.failureReason ?? "A Saga terminou em estado de falha.";
    const payload = JSON.stringify({
      transactionId: input.transactionId,
      transactionCode: input.transactionCode,
      workflowId: input.workflowId,
      failureCode: input.failureCode,
      failureReason: input.failureReason,
    });

    // A chave tem um índice único parcial no Postgres, que o Prisma não modela.
    // O ON CONFLICT usa o mesmo predicado para manter a gravação idempotente.
    await transaction.$executeRaw`
      INSERT INTO "analytics"."alerts" AS existing (
        "id", "type", "severity", "status", "dedup_key", "title", "message",
        "entity_type", "entity_id", "payload", "triggered_at", "last_seen_at"
      ) VALUES (
        ${randomUUID()}::uuid,
        'SAGA_FAILURE'::"analytics"."AlertType",
        'CRITICAL'::"analytics"."AlertSeverity",
        'OPEN'::"analytics"."AlertStatus",
        ${dedupKey},
        ${title},
        ${message},
        'Transaction',
        ${input.transactionId}::uuid,
        ${payload}::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("dedup_key") WHERE "status" IN ('OPEN', 'ACKNOWLEDGED')
      DO UPDATE SET
        "occurrences" = existing."occurrences" + 1,
        "last_seen_at" = CURRENT_TIMESTAMP,
        "message" = EXCLUDED."message",
        "payload" = EXCLUDED."payload"
    `;
  }

  async list() {
    const [items, statusGroups, criticalCount] = await this.prisma.$transaction([
      this.prisma.alert.findMany({ orderBy: [{ triggeredAt: "desc" }, { id: "desc" }] }),
      this.prisma.alert.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.alert.count({ where: { severity: "CRITICAL", status: { in: ["OPEN", "ACKNOWLEDGED"] } } }),
    ]);

    const counts = new Map<string, number>();
    for (const group of statusGroups) counts.set(group.status, group._count._all);
    return {
      items,
      total: items.length,
      counts: {
        open: counts.get("OPEN") ?? 0,
        acknowledged: counts.get("ACKNOWLEDGED") ?? 0,
        resolved: (counts.get("RESOLVED") ?? 0) + (counts.get("SUPPRESSED") ?? 0),
        critical: criticalCount,
      },
    };
  }

  async updateStatus(id: string, status: AlertStatusInput, actorId: string) {
    const current = await this.prisma.alert.findUnique({ where: { id } });
    if (!current) throw new NotFoundError("Alerta não encontrado.");

    if (status === "ACKNOWLEDGED" && current.status === "ACKNOWLEDGED") return current;
    if (status === "RESOLVED" && current.status === "RESOLVED") return current;
    if (current.status !== "OPEN" && !(status === "RESOLVED" && current.status === "ACKNOWLEDGED")) {
      throw new AppError("O alerta já não pode mudar para esse estado.", 409, "ALERT_STATUS_CONFLICT");
    }

    const updated = await this.prisma.alert.updateMany({
      where: {
        id,
        status: status === "ACKNOWLEDGED" ? "OPEN" : { in: ["OPEN", "ACKNOWLEDGED"] },
      },
      data: status === "ACKNOWLEDGED"
        ? { status, acknowledgedAt: new Date(), acknowledgedBy: actorId }
        : { status, resolvedAt: new Date(), resolvedBy: actorId },
    });
    if (updated.count !== 1) {
      const latest = await this.prisma.alert.findUnique({ where: { id } });
      if (latest?.status === status) return latest;
      throw new AppError("O alerta foi atualizado por outra operação.", 409, "ALERT_STATUS_CONFLICT");
    }

    const result = await this.prisma.alert.findUnique({ where: { id } });
    if (!result) throw new NotFoundError("Alerta não encontrado.");
    return result;
  }

  async resolveAll(actorId: string): Promise<number> {
    const result = await this.prisma.alert.updateMany({
      where: { status: { in: ["OPEN", "ACKNOWLEDGED"] } },
      data: { status: "RESOLVED", resolvedAt: new Date(), resolvedBy: actorId },
    });
    return result.count;
  }
}
