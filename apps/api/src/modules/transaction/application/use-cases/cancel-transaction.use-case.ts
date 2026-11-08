import type { Logger } from "@iron-ledger/logger";
import type { TransactionDetailDto } from "@iron-ledger/shared-types";
import { AppError } from "../../../../shared/errors/domain.error";
import { NotFoundError } from "../../../../shared/errors/not-found.error";
import type { TransactionReadModel, TransactionRepository } from "../../domain/repositories/transaction.repository";
import { isTerminal, type TransactionStatus } from "../../domain/value-objects/transaction-status";
import { mutateTransaction } from "../mutate-transaction";
import type { WorkflowOrchestrator } from "../ports/workflow-orchestrator.port";

export interface CancelTransactionCommand {
  transactionId: string;
  actorId: string;
}

export interface CancelTransactionResult {
  transaction: TransactionDetailDto;
  /** `false` quando a transação já estava cancelada (repetição idempotente). */
  accepted: boolean;
}

/**
 * Pede o cancelamento da Saga. O estado da transação só muda quando o worker
 * reporta o desfecho: a Saga libera a reserva ativa antes de declarar `CANCELLED`
 * e, se o estoque já foi baixado, conclui como `COMPLETED`.
 */
export class CancelTransactionUseCase {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly readModel: TransactionReadModel,
    private readonly orchestrator: WorkflowOrchestrator,
    private readonly logger: Pick<Logger, "info">,
  ) {}

  async execute(command: CancelTransactionCommand): Promise<CancelTransactionResult> {
    const transaction = await this.transactions.findById(command.transactionId);
    if (!transaction) throw new NotFoundError("Transação não encontrada.");
    if (transaction.status === "CANCELLED") return { transaction: await this.detail(transaction.id), accepted: false };
    this.assertCancellable(transaction.status);

    const result = await this.orchestrator.cancelTransactionSaga(transaction.snapshot().workflowId);
    this.logger.info({ transactionId: transaction.id, result }, "Cancelamento da Saga solicitado");
    if (result === "NOT_FOUND") await this.cancelWithoutWorkflow(transaction.id, command.actorId);
    return { transaction: await this.detail(transaction.id), accepted: true };
  }

  private assertCancellable(status: TransactionStatus): void {
    if (isTerminal(status)) {
      throw new AppError(`A transação já foi finalizada como ${status}.`, 409, "TRANSACTION_ALREADY_FINALIZED");
    }
  }

  /**
   * Sem workflow não há quem reporte o desfecho. Só uma transação ainda PENDING
   * (Saga nunca iniciada) pode ser cancelada direto; nas demais o workflow acabou
   * de terminar e o desfecho dele prevalece.
   */
  private async cancelWithoutWorkflow(transactionId: string, actorId: string): Promise<void> {
    const current = await mutateTransaction(this.transactions, transactionId, (loaded) => {
      if (loaded.status !== "PENDING") return false;
      return loaded.applyOutcome({ status: "CANCELLED", reason: "Cancelada antes do início da Saga." }, actorId);
    });
    if (current.status !== "CANCELLED") {
      throw new AppError("A transação não pode ser cancelada neste momento.", 409, "TRANSACTION_NOT_CANCELLABLE");
    }
  }

  private async detail(id: string): Promise<TransactionDetailDto> {
    const detail = await this.readModel.findDetail(id);
    if (!detail) throw new NotFoundError("Transação não encontrada.");
    return detail;
  }
}
