import type { RecordSagaStepInput } from "@iron-ledger/workflow-contracts";
import { NotFoundError } from "../../../../shared/errors/not-found.error";
import type { TransactionRepository } from "../../domain/repositories/transaction.repository";
import { mutateTransaction } from "../mutate-transaction";

/**
 * Recebe do worker o progresso de cada passo da Saga. O passo é gravado de forma
 * idempotente; efeitos no agregado (reserva obtida, compensação iniciada) também.
 */
export class RecordSagaStepUseCase {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(step: RecordSagaStepInput): Promise<void> {
    const transaction = await this.transactions.findById(step.transactionId);
    if (!transaction) throw new NotFoundError("Transação não encontrada.");

    await this.transactions.recordStep(step);

    await mutateTransaction(this.transactions, step.transactionId, (current) => {
      let changed = current.markProcessing(null);
      const reservationId = step.output?.reservationId;
      if (step.name === "reserveStock" && step.status === "SUCCEEDED" && typeof reservationId === "string") {
        changed = current.recordReservation(reservationId) || changed;
      }
      if (step.kind === "COMPENSATION" && step.status === "RUNNING") {
        changed = current.beginCompensation() || changed;
      }
      return changed;
    });
  }
}
