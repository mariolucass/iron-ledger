import type { TransactionDetailDto } from "@iron-ledger/shared-types";
import type { ReportTransactionOutcomeInput } from "@iron-ledger/workflow-contracts";
import { NotFoundError } from "../../../../shared/errors/not-found.error";
import type { TransactionReadModel, TransactionRepository } from "../../domain/repositories/transaction.repository";
import { mutateTransaction } from "../mutate-transaction";

/** Finaliza a transação com o desfecho da Saga e emite o evento correspondente. */
export class ReportTransactionOutcomeUseCase {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly readModel: TransactionReadModel,
  ) {}

  async execute(input: ReportTransactionOutcomeInput, actorId: string): Promise<TransactionDetailDto> {
    await mutateTransaction(this.transactions, input.transactionId, (current) => {
      // A Saga pode terminar antes de qualquer passo ser registrado (ex.: falha imediata).
      const started = current.markProcessing(null);
      return current.applyOutcome(input.outcome, actorId) || started;
    });
    const detail = await this.readModel.findDetail(input.transactionId);
    if (!detail) throw new NotFoundError("Transação não encontrada.");
    return detail;
  }
}
