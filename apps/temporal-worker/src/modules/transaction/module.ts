import type { WorkerModule } from "../../shared/worker-module";
import { createLifecycleActivities } from "./activities/create-lifecycle-activities";
import { createTransactionActivities } from "./activities/create-transaction-activities";
import { InventoryApiGateway } from "./gateways/inventory-api.gateway";
import { TransactionApiGateway } from "./gateways/transaction-api.gateway";

export const workerModule: WorkerModule = {
  name: "transaction",
  createActivities: ({ api, correlationId }) => ({
    ...createTransactionActivities(new InventoryApiGateway(api), correlationId),
    ...createLifecycleActivities(new TransactionApiGateway(api), correlationId),
  }),
};
