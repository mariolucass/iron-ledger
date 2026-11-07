import type {
  RecordSagaStepInput,
  ReportTransactionOutcomeInput,
} from "@iron-ledger/workflow-contracts/transaction";

/** Porta para o contexto `transaction` da API: progresso e desfecho da Saga. */
export interface TransactionLifecycleGateway {
  recordStep(input: RecordSagaStepInput, correlationId?: string): Promise<void>;
  reportOutcome(input: ReportTransactionOutcomeInput, correlationId?: string): Promise<void>;
}
