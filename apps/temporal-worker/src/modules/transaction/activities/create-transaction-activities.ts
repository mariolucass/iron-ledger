import { ApplicationFailure } from "@temporalio/activity";
import type { InventoryGateway } from "../ports/inventory-gateway";
import type { TransactionActivities } from "../contracts/transaction-activities";
import { runGatewayOperation as execute } from "./gateway-failure";

export function createTransactionActivities(
  gateway: InventoryGateway,
  correlationId: () => string | undefined = () => undefined,
): TransactionActivities {
  return {
    reserveStock: (input) => execute(() => gateway.reserve(input, correlationId())),
    confirmTransaction: async (input) => {
      if (input.failConfirmation) {
        throw ApplicationFailure.nonRetryable(
          "Falha de confirmação solicitada para demonstrar compensação.",
        );
      }
      return execute(() => gateway.commit(input.reservationId, correlationId()));
    },
    compensateStock: (id) => execute(() => gateway.release(id, correlationId())),
    reconcileReservation: (id) => execute(() => gateway.findByTransaction(id, correlationId())),
  };
}
