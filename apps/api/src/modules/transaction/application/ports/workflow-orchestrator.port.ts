import type { TransactionSagaInput } from "@iron-ledger/workflow-contracts";

export interface StartedWorkflow {
  workflowId: string;
  runId: string;
  /** `false` quando o workflow já existia (repetição idempotente do comando). */
  created: boolean;
}

/** Porta de saída para o motor de workflows (Temporal na implementação atual). */
export interface WorkflowOrchestrator {
  startTransactionSaga(workflowId: string, input: TransactionSagaInput): Promise<StartedWorkflow>;
}
