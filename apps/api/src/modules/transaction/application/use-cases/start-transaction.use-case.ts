import type { TransactionDetailDto } from "@iron-ledger/shared-types";
import type { Logger } from "@iron-ledger/logger";
import { AppError } from "../../../../shared/errors/domain.error";
import { NotFoundError } from "../../../../shared/errors/not-found.error";
import { generateTransactionCode, Transaction } from "../../domain/entities/transaction.entity";
import type { TransactionReadModel, TransactionRepository } from "../../domain/repositories/transaction.repository";
import { mutateTransaction } from "../mutate-transaction";
import type { StockAvailabilityPort } from "../ports/stock-availability.port";
import type { WorkflowOrchestrator } from "../ports/workflow-orchestrator.port";

export interface StartTransactionCommand {
  stockLevelId: string;
  quantity: number;
  externalRef?: string;
  failConfirmation: boolean;
  actorId: string;
  correlationId?: string;
  /** Header `Idempotency-Key`: repetir o comando devolve a mesma transação. */
  idempotencyKey?: string;
}

export interface StartTransactionResult {
  transaction: TransactionDetailDto;
  created: boolean;
}

/**
 * Comando de entrada da Saga:
 * 1. valida o saldo disponível (falha rápida, antes de envolver o Temporal);
 * 2. persiste a transação PENDING + evento `TransactionStarted` no outbox;
 * 3. inicia o workflow com ID igual ao da transação e marca PROCESSING.
 * Se o Temporal recusar, a transação termina FAILED, sem efeito em estoque.
 */
export class StartTransactionUseCase {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly readModel: TransactionReadModel,
    private readonly stock: StockAvailabilityPort,
    private readonly orchestrator: WorkflowOrchestrator,
    private readonly logger: Pick<Logger, "info" | "error">,
  ) {}

  async execute(command: StartTransactionCommand): Promise<StartTransactionResult> {
    if (command.idempotencyKey) {
      const existing = await this.transactions.findByIdempotencyKey(command.actorId, command.idempotencyKey);
      if (existing) return { transaction: await this.detail(existing.id), created: false };
    }

    const stock = await this.stock.find(command.stockLevelId);
    if (!stock) throw new NotFoundError("Saldo de estoque não encontrado.");
    if (!stock.isSellable) throw new AppError("O produto ou o armazém não está ativo.", 422, "STOCK_NOT_SELLABLE");
    if (stock.available < command.quantity) {
      throw new AppError("Saldo disponível insuficiente para a transação.", 409, "INSUFFICIENT_STOCK");
    }

    const transaction = Transaction.start({
      code: generateTransactionCode(),
      stock,
      quantity: command.quantity,
      initiatedBy: command.actorId,
      correlationId: command.correlationId,
      idempotencyKey: command.idempotencyKey,
      externalRef: command.externalRef,
    });
    if (await this.transactions.create(transaction) === "DUPLICATE") {
      const winner = command.idempotencyKey
        ? await this.transactions.findByIdempotencyKey(command.actorId, command.idempotencyKey)
        : null;
      if (!winner) throw new AppError("Requisição concorrente com a mesma chave de idempotência.", 409, "IDEMPOTENCY_CONFLICT");
      return { transaction: await this.detail(winner.id), created: false };
    }
    this.logger.info({ transactionId: transaction.id }, "Transação criada; iniciando Saga");

    let runId: string;
    try {
      const started = await this.orchestrator.startTransactionSaga(transaction.snapshot().workflowId, {
        transactionId: transaction.id,
        stockLevelId: stock.stockLevelId,
        quantity: command.quantity,
        failConfirmation: command.failConfirmation,
        correlationId: command.correlationId,
      });
      runId = started.runId;
    } catch (error) {
      this.logger.error({ err: error, transactionId: transaction.id }, "Falha ao iniciar a Saga");
      const current = await mutateTransaction(this.transactions, transaction.id, (loaded) => {
        // Se o worker já reportou progresso, o workflow existe apesar do erro na resposta.
        if (loaded.status !== "PENDING") return false;
        loaded.fail("Não foi possível iniciar a Saga no Temporal.", "WORKFLOW_START_FAILED", command.actorId);
        return true;
      });
      if (current.status !== "FAILED") return { transaction: await this.detail(transaction.id), created: true };
      if (error instanceof AppError) throw error;
      throw new AppError("O orquestrador de workflows está indisponível.", 503, "TEMPORAL_UNAVAILABLE");
    }

    await mutateTransaction(this.transactions, transaction.id, (current) => current.markProcessing(runId));
    return { transaction: await this.detail(transaction.id), created: true };
  }

  private async detail(id: string): Promise<TransactionDetailDto> {
    const detail = await this.readModel.findDetail(id);
    if (!detail) throw new NotFoundError("Transação não encontrada.");
    return detail;
  }
}
