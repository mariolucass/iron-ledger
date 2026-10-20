import type {
  RecordSagaStepInput,
  ReportTransactionOutcomeInput,
} from "@iron-ledger/workflow-contracts";
import type { TransactionLifecycleGateway } from "../../ports/transaction-lifecycle-gateway";
import type { ApiClient } from "./api-client";

export class TransactionApiGateway implements TransactionLifecycleGateway {
  constructor(private readonly client: ApiClient) {}

  async recordStep(
    { transactionId, ...step }: RecordSagaStepInput,
    correlationId?: string,
  ): Promise<void> {
    await this.client.request(
      "POST",
      `/transactions/${encodeURIComponent(transactionId)}/steps`,
      step,
      correlationId,
    );
  }

  async reportOutcome(
    { transactionId, outcome }: ReportTransactionOutcomeInput,
    correlationId?: string,
  ): Promise<void> {
    await this.client.request(
      "POST",
      `/transactions/${encodeURIComponent(transactionId)}/outcome`,
      outcome,
      correlationId,
    );
  }
}
