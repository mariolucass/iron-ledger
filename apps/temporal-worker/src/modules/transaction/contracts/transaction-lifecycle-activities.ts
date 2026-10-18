import type { RecordSagaStepInput, ReportTransactionOutcomeInput } from "@iron-ledger/workflow-contracts";

/**
 * Activities que espelham a Saga no contexto `transaction` da API. Ficam fora de
 * `TransactionActivities` para não alterar o contrato das histories já gravadas.
 */
export interface TransactionLifecycleActivities {
  recordSagaStep(input: RecordSagaStepInput): Promise<void>;
  reportTransactionOutcome(input: ReportTransactionOutcomeInput): Promise<void>;
}
