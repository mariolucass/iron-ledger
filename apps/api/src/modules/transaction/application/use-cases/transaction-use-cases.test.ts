import { describe, expect, it, vi } from "vitest";
import type { TransactionDetailDto } from "@iron-ledger/shared-types";
import type { RecordSagaStepInput } from "@iron-ledger/workflow-contracts";
import { AppError } from "../../../../shared/errors/domain.error";
import { Transaction } from "../../domain/entities/transaction.entity";
import type { TransactionReadModel, TransactionRepository } from "../../domain/repositories/transaction.repository";
import type { StockAvailabilityPort } from "../ports/stock-availability.port";
import type { WorkflowOrchestrator } from "../ports/workflow-orchestrator.port";
import { RecordSagaStepUseCase } from "./record-saga-step.use-case";
import { ReportTransactionOutcomeUseCase } from "./report-transaction-outcome.use-case";
import { StartTransactionUseCase } from "./start-transaction.use-case";

/** Repositório em memória com concorrência otimista real (versão por agregado). */
class MemoryTransactions implements TransactionRepository, TransactionReadModel {
  rows = new Map<string, ReturnType<Transaction["snapshot"]>>();
  events: string[] = [];
  steps: RecordSagaStepInput[] = [];
  conflictsToSimulate = 0;

  async create(transaction: Transaction) {
    const snapshot = transaction.snapshot();
    const duplicate = [...this.rows.values()].some((row) => row.idempotencyKey && row.idempotencyKey === snapshot.idempotencyKey);
    if (duplicate) return "DUPLICATE" as const;
    this.rows.set(snapshot.id, snapshot);
    this.events.push(...transaction.pendingEvents().map((event) => event.eventName));
    transaction.committed(snapshot.version);
    return "CREATED" as const;
  }

  async save(transaction: Transaction) {
    if (this.conflictsToSimulate > 0) {
      this.conflictsToSimulate--;
      throw new AppError("conflito", 409, "CONCURRENT_OPERATION");
    }
    const snapshot = transaction.snapshot();
    const stored = this.rows.get(snapshot.id)!;
    if (stored.version !== snapshot.version) throw new AppError("conflito", 409, "CONCURRENT_OPERATION");
    this.rows.set(snapshot.id, { ...snapshot, version: snapshot.version + 1 });
    this.events.push(...transaction.pendingEvents().map((event) => event.eventName));
    transaction.committed(snapshot.version + 1);
  }

  async findById(id: string) {
    const row = this.rows.get(id);
    return row ? Transaction.restore(row) : null;
  }

  async findByIdempotencyKey(_initiatedBy: string, key: string) {
    const row = [...this.rows.values()].find((candidate) => candidate.idempotencyKey === key);
    return row ? Transaction.restore(row) : null;
  }

  async recordStep(step: RecordSagaStepInput) { this.steps.push(step); }

  async findDetail(id: string) {
    const row = this.rows.get(id);
    return row ? ({ id: row.id, status: row.status, items: row.items } as unknown as TransactionDetailDto) : null;
  }

  async list() { return { items: [], page: 1, pageSize: 20, total: 0 }; }
}

const stockLevelId = "30000000-0000-4000-8000-000000000001";
const stock: StockAvailabilityPort = {
  find: async () => ({ stockLevelId, productId: "p", warehouseId: "w", sku: "SKU", available: 5, isSellable: true }),
};
const logger = { info: vi.fn(), error: vi.fn() };
const command = { stockLevelId, quantity: 2, failConfirmation: false, actorId: "user-1", correlationId: "corr" };

function setup(orchestrator: WorkflowOrchestrator = { startTransactionSaga: async (workflowId) => ({ workflowId, runId: "run-1", created: true }) }) {
  const repository = new MemoryTransactions();
  return { repository, useCase: new StartTransactionUseCase(repository, repository, stock, orchestrator, logger) };
}

describe("StartTransactionUseCase", () => {
  it("persiste, inicia a Saga com o ID da transação e marca PROCESSING", async () => {
    const startTransactionSaga = vi.fn(async (workflowId: string) => ({ workflowId, runId: "run-1", created: true }));
    const { repository, useCase } = setup({ startTransactionSaga });
    const result = await useCase.execute(command);
    expect(result.created).toBe(true);
    expect(result.transaction.status).toBe("PROCESSING");
    expect(startTransactionSaga).toHaveBeenCalledWith(result.transaction.id, expect.objectContaining({
      transactionId: result.transaction.id, stockLevelId, quantity: 2, correlationId: "corr",
    }));
    expect(repository.events).toEqual(["Transaction.TransactionStarted"]);
  });

  it("recusa saldo insuficiente antes de envolver o Temporal", async () => {
    const startTransactionSaga = vi.fn();
    const { useCase } = setup({ startTransactionSaga });
    await expect(useCase.execute({ ...command, quantity: 6 })).rejects.toMatchObject({ code: "INSUFFICIENT_STOCK", statusCode: 409 });
    expect(startTransactionSaga).not.toHaveBeenCalled();
  });

  it("devolve a mesma transação para a mesma chave de idempotência", async () => {
    const startTransactionSaga = vi.fn(async (workflowId: string) => ({ workflowId, runId: "run-1", created: true }));
    const { useCase } = setup({ startTransactionSaga });
    const first = await useCase.execute({ ...command, idempotencyKey: "pedido-0001" });
    const repeated = await useCase.execute({ ...command, idempotencyKey: "pedido-0001" });
    expect(repeated.created).toBe(false);
    expect(repeated.transaction.id).toBe(first.transaction.id);
    expect(startTransactionSaga).toHaveBeenCalledTimes(1);
  });

  it("finaliza FAILED e responde 503 quando o Temporal recusa", async () => {
    const { repository, useCase } = setup({ startTransactionSaga: async () => { throw new Error("connect ECONNREFUSED"); } });
    await expect(useCase.execute(command)).rejects.toMatchObject({ code: "TEMPORAL_UNAVAILABLE", statusCode: 503 });
    const [row] = repository.rows.values();
    expect(row?.status).toBe("FAILED");
    expect(row?.failureCode).toBe("WORKFLOW_START_FAILED");
    expect(repository.events).toEqual(["Transaction.TransactionStarted", "Transaction.TransactionFailed"]);
  });
});

describe("Saga → contexto de transação", () => {
  async function processing() {
    const { repository, useCase } = setup();
    const { transaction } = await useCase.execute(command);
    return { repository, id: transaction.id };
  }

  it("passo de reserva concluído vincula a reserva ao item", async () => {
    const { repository, id } = await processing();
    await new RecordSagaStepUseCase(repository).execute({
      transactionId: id, sequence: 1, name: "reserveStock", kind: "ACTION", status: "SUCCEEDED",
      startedAt: "2026-10-18T12:00:00.000Z", output: { reservationId: "r-1" },
    });
    expect(repository.rows.get(id)?.items[0]).toMatchObject({ status: "RESERVED", reservationId: "r-1" });
    expect(repository.steps).toHaveLength(1);
  });

  it("início da compensação move para COMPENSATING mesmo com conflito de versão", async () => {
    const { repository, id } = await processing();
    repository.conflictsToSimulate = 2;
    await new RecordSagaStepUseCase(repository).execute({
      transactionId: id, sequence: 4, name: "compensateStock", kind: "COMPENSATION", status: "RUNNING", startedAt: "2026-10-18T12:00:00.000Z",
    });
    expect(repository.rows.get(id)?.status).toBe("COMPENSATING");
  });

  it("desfecho finaliza a transação e é idempotente", async () => {
    const { repository, id } = await processing();
    const report = new ReportTransactionOutcomeUseCase(repository, repository);
    const outcome = { status: "COMPLETED" as const, reservationId: "r-1", movementId: "m-1" };
    await report.execute({ transactionId: id, outcome }, "worker");
    await report.execute({ transactionId: id, outcome }, "worker");
    expect(repository.rows.get(id)?.status).toBe("COMPLETED");
    expect(repository.events.filter((name) => name === "Transaction.TransactionCompleted")).toHaveLength(1);
  });
});
