import type { TransactionSagaInput } from "@iron-ledger/workflow-contracts";

export interface StartedWorkflow {
  workflowId: string;
  runId: string;
  /** `false` quando o workflow já existia (repetição idempotente do comando). */
  created: boolean;
}

/** `NOT_FOUND`: o workflow não existe (ainda) ou já foi encerrado. */
export type CancelRequestResult = "REQUESTED" | "NOT_FOUND";

/** Porta de saída para o motor de workflows (Temporal na implementação atual). */
export interface WorkflowOrchestrator {
  startTransactionSaga(workflowId: string, input: TransactionSagaInput): Promise<StartedWorkflow>;
  /** Pede o cancelamento; a Saga libera a reserva ativa e reporta `CANCELLED` por conta própria. */
  cancelTransactionSaga(workflowId: string): Promise<CancelRequestResult>;
}
