import type { TransactionLifecycleGateway } from "../ports/transaction-lifecycle-gateway";
import type { TransactionLifecycleActivities } from "../contracts/transaction-lifecycle-activities";
import { runGatewayOperation as execute } from "./gateway-failure";

export function createLifecycleActivities(
  gateway: TransactionLifecycleGateway,
  correlationId: () => string | undefined = () => undefined,
): TransactionLifecycleActivities {
  return {
    recordSagaStep: (input) => execute(() => gateway.recordStep(input, correlationId())),
    reportTransactionOutcome: (input) =>
      execute(() => gateway.reportOutcome(input, correlationId())),
  };
}
