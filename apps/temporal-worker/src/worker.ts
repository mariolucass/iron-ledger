import { NativeConnection, Worker } from "@temporalio/worker";
import { reserveStock } from "./activities/reserve-stock.activity";
import { confirmTransaction } from "./activities/confirm-transaction.activity";
import { compensateStock } from "./activities/compensate-stock.activity";

async function main() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? "localhost:7233",
  });
  const worker = await Worker.create({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE ?? "default",
    taskQueue: process.env.TEMPORAL_TASK_QUEUE ?? "iron-ledger-tasks",
    workflowsPath: require.resolve("./workflows/transaction-saga.workflow"),
    activities: { reserveStock, confirmTransaction, compensateStock },
  });
  console.log(`Temporal worker pronto para a fila ${process.env.TEMPORAL_TASK_QUEUE ?? "iron-ledger-tasks"}`);
  try {
    await worker.run();
  } finally {
    await connection.close();
  }
}

void main().catch((error) => {
  console.error("Falha ao iniciar Temporal worker", error);
  process.exitCode = 1;
});
