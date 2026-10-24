import { Prisma, type PrismaClient } from "@prisma/client";
import type {
  SagaStepDto,
  TransactionDetailDto,
  TransactionListDto,
  TransactionListQueryDto,
  TransactionSummaryDto,
} from "@iron-ledger/shared-types";
import type { RecordSagaStepInput } from "@iron-ledger/workflow-contracts";
import { enqueueEvents } from "../../../../infra/outbox/outbox.writer";
import { AppError } from "../../../../shared/errors/domain.error";
import { PrismaAlertRepository } from "../../../alerts/infra/repositories/prisma-alert.repository";
import { Transaction, type TransactionSnapshot } from "../../domain/entities/transaction.entity";
import type { TransactionReadModel, TransactionRepository } from "../../domain/repositories/transaction.repository";

const scopedKey = (initiatedBy: string, key: string) => `${initiatedBy}:${key}`;

const aggregateInclude = { items: { orderBy: { lineNumber: "asc" } } } satisfies Prisma.TransactionInclude;
type AggregateRow = Prisma.TransactionGetPayload<{ include: typeof aggregateInclude }>;

const detailInclude = {
  items: { orderBy: { lineNumber: "asc" } },
  sagaSteps: { orderBy: { sequence: "asc" } },
  statusHistory: { orderBy: { changedAt: "asc" } },
} satisfies Prisma.TransactionInclude;
type DetailRow = Prisma.TransactionGetPayload<{ include: typeof detailInclude }>;

const summaryInclude = { items: { select: { quantity: true } } } satisfies Prisma.TransactionInclude;
type SummaryRow = Prisma.TransactionGetPayload<{ include: typeof summaryInclude }>;

export interface PrismaTransactionRepositoryOptions {
  /** Executado após cada commit que gravou eventos (acorda o relay do outbox). */
  onEventsCommitted?: () => void;
}

/** Persistência do contexto `transaction` + projeções de leitura. */
export class PrismaTransactionRepository implements TransactionRepository, TransactionReadModel {
  private readonly alerts: PrismaAlertRepository;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly options: PrismaTransactionRepositoryOptions = {},
  ) {
    this.alerts = new PrismaAlertRepository(prisma);
  }

  async create(transaction: Transaction): Promise<"CREATED" | "DUPLICATE"> {
    const state = transaction.snapshot();
    const events = transaction.pendingEvents();
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.transaction.create({
          data: {
            id: state.id,
            code: state.code,
            type: state.type,
            status: state.status,
            workflowId: state.workflowId,
            idempotencyKey: state.idempotencyKey ? scopedKey(state.initiatedBy, state.idempotencyKey) : null,
            correlationId: state.correlationId,
            warehouseId: state.warehouseId,
            externalRef: state.externalRef,
            initiatedBy: state.initiatedBy,
            createdAt: state.createdAt,
            items: {
              create: state.items.map((item) => ({
                id: item.id,
                lineNumber: item.lineNumber,
                productId: item.productId,
                warehouseId: item.warehouseId,
                sku: item.sku,
                quantity: item.quantity,
                status: item.status,
              })),
            },
            statusHistory: { create: transaction.pendingChanges().map((change) => ({ ...change })) },
          },
        });
        await enqueueEvents(tx, events);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
        && String(error.meta?.target ?? "").includes("idempotency_key")) {
        return "DUPLICATE";
      }
      throw error;
    }
    transaction.committed(state.version);
    if (events.length > 0) this.options.onEventsCommitted?.();
    return "CREATED";
  }

  async save(transaction: Transaction): Promise<void> {
    const state = transaction.snapshot();
    const changes = transaction.pendingChanges();
    const events = transaction.pendingEvents();
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.updateMany({
        where: { id: state.id, version: state.version },
        data: {
          status: state.status,
          workflowRunId: state.workflowRunId,
          failureCode: state.failureCode,
          failureReason: state.failureReason,
          startedAt: state.startedAt,
          completedAt: state.completedAt,
          compensatedAt: state.compensatedAt,
          version: { increment: 1 },
        },
      });
      if (updated.count !== 1) {
        throw new AppError("A transação foi alterada por outra operação.", 409, "CONCURRENT_OPERATION");
      }
      for (const item of state.items) {
        await tx.transactionItem.update({
          where: { id: item.id },
          data: { status: item.status, reservationId: item.reservationId, movementId: item.movementId },
        });
      }
      if (changes.length > 0) {
        await tx.transactionStatusHistory.createMany({
          data: changes.map((change) => ({ ...change, transactionId: state.id })),
        });
      }
      if (changes.some((change) => change.toStatus === "FAILED")) {
        await this.alerts.createSagaFailure(tx, {
          transactionId: state.id,
          transactionCode: state.code,
          workflowId: state.workflowId,
          failureCode: state.failureCode,
          failureReason: state.failureReason,
        });
      }
      await enqueueEvents(tx, events);
    });
    transaction.committed(state.version + 1);
    if (events.length > 0) this.options.onEventsCommitted?.();
  }

  async findById(id: string): Promise<Transaction | null> {
    const row = await this.prisma.transaction.findUnique({ where: { id }, include: aggregateInclude });
    return row ? Transaction.restore(toSnapshot(row)) : null;
  }

  async findByIdempotencyKey(initiatedBy: string, idempotencyKey: string): Promise<Transaction | null> {
    const row = await this.prisma.transaction.findUnique({
      where: { idempotencyKey: scopedKey(initiatedBy, idempotencyKey) },
      include: aggregateInclude,
    });
    return row ? Transaction.restore(toSnapshot(row)) : null;
  }

  async recordStep(step: RecordSagaStepInput): Promise<void> {
    const key = { transactionId_sequence: { transactionId: step.transactionId, sequence: step.sequence } };
    const data = {
      name: step.name,
      kind: step.kind,
      status: step.status,
      startedAt: new Date(step.startedAt),
      finishedAt: step.finishedAt ? new Date(step.finishedAt) : null,
      output: step.output ?? Prisma.DbNull,
      error: step.error ? { message: step.error } : Prisma.DbNull,
    };
    const existing = await this.prisma.sagaStep.findUnique({ where: key, select: { status: true } });
    if (!existing) {
      try {
        await this.prisma.sagaStep.create({ data: { ...data, transactionId: step.transactionId, sequence: step.sequence } });
        return;
      } catch (error) {
        // Entrega concorrente do mesmo passo: segue para a atualização.
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
      }
    }
    // Um RUNNING atrasado nunca sobrescreve um passo já finalizado.
    if (step.status === "RUNNING") {
      await this.prisma.sagaStep.updateMany({
        where: { transactionId: step.transactionId, sequence: step.sequence, status: { in: ["SCHEDULED", "RUNNING"] } },
        data,
      });
      return;
    }
    await this.prisma.sagaStep.update({ where: key, data });
  }

  async findDetail(id: string): Promise<TransactionDetailDto | null> {
    const row = await this.prisma.transaction.findUnique({ where: { id }, include: detailInclude });
    return row ? toDetail(row) : null;
  }

  async list(query: TransactionListQueryDto & { page: number; pageSize: number }): Promise<TransactionListDto> {
    const where: Prisma.TransactionWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.code ? { code: { contains: query.code, mode: "insensitive" } } : {}),
      ...(query.from || query.to
        ? { createdAt: { ...(query.from ? { gte: new Date(query.from) } : {}), ...(query.to ? { lte: new Date(query.to) } : {}) } }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        include: summaryInclude,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return { items: rows.map(toSummary), page: query.page, pageSize: query.pageSize, total };
  }
}

function toSnapshot(row: AggregateRow): TransactionSnapshot {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    status: row.status,
    workflowId: row.workflowId,
    workflowRunId: row.workflowRunId,
    idempotencyKey: row.idempotencyKey,
    correlationId: row.correlationId,
    warehouseId: row.warehouseId,
    externalRef: row.externalRef,
    failureCode: row.failureCode,
    failureReason: row.failureReason,
    initiatedBy: row.initiatedBy,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    compensatedAt: row.compensatedAt,
    version: row.version,
    createdAt: row.createdAt,
    items: row.items.map((item) => ({
      id: item.id,
      lineNumber: item.lineNumber,
      productId: item.productId,
      warehouseId: item.warehouseId,
      sku: item.sku,
      quantity: item.quantity.toNumber(),
      status: item.status,
      reservationId: item.reservationId,
      movementId: item.movementId,
    })),
  };
}

function toSummary(row: SummaryRow | DetailRow): TransactionSummaryDto {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    status: row.status,
    workflowId: row.workflowId,
    correlationId: row.correlationId,
    externalRef: row.externalRef,
    itemCount: row.items.length,
    totalQuantity: row.items.reduce((sum, item) => sum + item.quantity.toNumber(), 0),
    initiatedBy: row.initiatedBy,
    failureReason: row.failureReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

function toDetail(row: DetailRow): TransactionDetailDto {
  return {
    ...toSummary(row),
    workflowRunId: row.workflowRunId,
    items: row.items.map((item) => ({
      id: item.id,
      lineNumber: item.lineNumber,
      productId: item.productId,
      warehouseId: item.warehouseId,
      sku: item.sku,
      quantity: item.quantity.toNumber(),
      status: item.status,
      reservationId: item.reservationId,
      movementId: item.movementId,
    })),
    steps: row.sagaSteps.map((step): SagaStepDto => ({
      id: step.id,
      sequence: step.sequence,
      name: step.name,
      kind: step.kind,
      status: step.status,
      attempt: step.attempt,
      startedAt: step.startedAt?.toISOString() ?? null,
      finishedAt: step.finishedAt?.toISOString() ?? null,
      error: errorMessage(step.error),
    })),
    history: row.statusHistory.map((change) => ({
      fromStatus: change.fromStatus,
      toStatus: change.toStatus,
      reason: change.reason,
      changedBy: change.changedBy,
      changedAt: change.changedAt.toISOString(),
    })),
  };
}

function errorMessage(value: Prisma.JsonValue): string | null {
  if (value && typeof value === "object" && !Array.isArray(value) && typeof value.message === "string") return value.message;
  return null;
}
