import { AppError } from "../../../shared/errors/domain.error";
import { NotFoundError } from "../../../shared/errors/not-found.error";
import type { Transaction } from "../domain/entities/transaction.entity";
import type { TransactionRepository } from "../domain/repositories/transaction.repository";

const CONFLICT_CODES = new Set(["CONCURRENT_OPERATION"]);

/**
 * Carrega o agregado, aplica `change` e persiste. Em conflito de versão (API e
 * worker alterando a mesma transação), recarrega e reaplica algumas vezes.
 * `change` retorna `false` quando não há nada a gravar.
 */
export async function mutateTransaction(
  repository: TransactionRepository,
  id: string,
  change: (transaction: Transaction) => boolean,
  attempts = 4,
): Promise<Transaction> {
  for (let attempt = 1; ; attempt++) {
    const transaction = await repository.findById(id);
    if (!transaction) throw new NotFoundError("Transação não encontrada.");
    if (!change(transaction)) return transaction;
    try {
      await repository.save(transaction);
      return transaction;
    } catch (error) {
      const retry = error instanceof AppError && CONFLICT_CODES.has(error.code) && attempt < attempts;
      if (!retry) throw error;
    }
  }
}
