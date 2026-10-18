import { transactionApi, type SagaStep, type TransactionDetail } from "@/entities/transaction";
import { withSession } from "@/shared/auth/with-session";

export function fetchTransaction(id: string): Promise<TransactionDetail> {
  return withSession(transactionApi.get(id));
}

export const formatDateTime = (value: string | null) =>
  value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value)) : "—";

/** Duração do passo em ms/s, quando já terminou. */
export function stepDuration(step: SagaStep): string | null {
  if (!step.startedAt || !step.finishedAt) return null;
  const ms = Date.parse(step.finishedAt) - Date.parse(step.startedAt);
  if (!Number.isFinite(ms) || ms < 0) return null;
  return ms < 1_000 ? `${ms} ms` : `${(ms / 1_000).toFixed(1)} s`;
}
