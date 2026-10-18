import type {
  TransactionDetailDto,
  TransactionListDto,
  TransactionListQueryDto,
} from "@iron-ledger/shared-types";
import type { RecordSagaStepInput } from "@iron-ledger/workflow-contracts";
import type { Transaction } from "../entities/transaction.entity";

/** Lado de escrita: persiste o agregado, o histórico e o outbox atomicamente. */
export interface TransactionRepository {
  /** `DUPLICATE` quando outra request concorrente já gravou a mesma chave de idempotência. */
  create(transaction: Transaction): Promise<"CREATED" | "DUPLICATE">;
  /** Atualiza com concorrência otimista; lança 409 se a versão mudou. */
  save(transaction: Transaction): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
  findByIdempotencyKey(initiatedBy: string, idempotencyKey: string): Promise<Transaction | null>;
  /** Upsert idempotente por (transação, sequência). */
  recordStep(step: RecordSagaStepInput): Promise<void>;
}

/** Lado de leitura (CQRS leve): projeções prontas para a API pública. */
export interface TransactionReadModel {
  findDetail(id: string): Promise<TransactionDetailDto | null>;
  list(query: Required<Pick<TransactionListQueryDto, "page" | "pageSize">> & TransactionListQueryDto): Promise<TransactionListDto>;
}
