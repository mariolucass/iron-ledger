import { requestJson, withQuery, type PaginatedResponse } from "@/shared/api/client";
import type {
  StartTransactionInput,
  TransactionDetail,
  TransactionQuery,
  TransactionSummary,
} from "../model/types";

export interface StartTransactionOptions {
  /** Repetir a mesma chave (ex.: duplo clique, retry de rede) devolve a mesma transação. */
  idempotencyKey?: string;
}

export const transactionApi = {
  list: (query: TransactionQuery = {}) =>
    requestJson<PaginatedResponse<TransactionSummary>>(withQuery("/api/transactions", query)),
  get: (id: string) =>
    requestJson<TransactionDetail>(`/api/transactions/${encodeURIComponent(id)}`),
  start: (input: StartTransactionInput, options: StartTransactionOptions = {}) =>
    requestJson<TransactionDetail>("/api/transactions", {
      method: "POST",
      body: JSON.stringify(input),
      headers: options.idempotencyKey ? { "idempotency-key": options.idempotencyKey } : undefined,
    }),
};
