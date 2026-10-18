import { NativeConnection, Runtime, Worker } from "@temporalio/worker";
import { activityInfo } from "@temporalio/activity";
import { createLifecycleActivities } from "../modules/transaction/activities/create-lifecycle-activities";
import { createTransactionActivities } from "../modules/transaction/activities/create-transaction-activities";
import { ServiceTokenProvider } from "../infrastructure/auth/service-token-provider";
import { ApiClient } from "../infrastructure/http/api-client";
import { InventoryApiGateway } from "../infrastructure/http/inventory-api.gateway";
import { TransactionApiGateway } from "../infrastructure/http/transaction-api.gateway";
import { loadConfig } from "./config";
import { logger, temporalLogger } from "./logger";

/** O workflowId é o ID da transação: correlaciona todas as chamadas à API. */
const correlationId = () => activityInfo().workflowExecution?.workflowId;

export async function runWorker() {
  const config = loadConfig();
  Runtime.install({ logger: temporalLogger() });

  const tokens = new ServiceTokenProvider({ apiUrl: config.apiUrl, email: config.serviceEmail, password: config.servicePassword });
  const api = new ApiClient(config.apiUrl, tokens);
  const connection = await NativeConnection.connect({ address: config.temporalAddress });
  try {
    const worker = await Worker.create({
      connection,
      namespace: config.namespace,
      taskQueue: config.taskQueue,
      workflowsPath: require.resolve("../workflows"),
      activities: {
        ...createTransactionActivities(new InventoryApiGateway(api), correlationId),
        ...createLifecycleActivities(new TransactionApiGateway(api), correlationId),
      },
    });

    for (const signal of ["SIGINT", "SIGTERM"] as const) {
      process.once(signal, () => {
        logger.info({ signal }, "Encerrando worker; aguardando activities em andamento");
        worker.shutdown();
      });
    }

    logger.info({ taskQueue: config.taskQueue, namespace: config.namespace, apiUrl: config.apiUrl }, "Temporal worker pronto");
    await worker.run();
    logger.info({}, "Temporal worker encerrado");
  } finally {
    await connection.close();
  }
}
