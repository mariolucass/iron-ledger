import { Client, Connection } from "@temporalio/client";
import { env } from "../../../../config/env";
import { AppError } from "../../../../shared/errors/domain.error";

export type SagaInput = {
  transactionId: string;
  stockLevelId: string;
  quantity: number;
  failConfirmation: boolean;
};

async function withClient<T>(run: (client: Client) => Promise<T>): Promise<T> {
  const connection = await Connection.connect({ address: env.TEMPORAL_ADDRESS, connectTimeout: "5 seconds" })
    .catch(() => { throw new AppError("Temporal está indisponível.", 503, "TEMPORAL_UNAVAILABLE"); });
  try {
    return await run(new Client({ connection, namespace: env.TEMPORAL_NAMESPACE }));
  } finally {
    await connection.close();
  }
}

export function startTransactionSaga(input: SagaInput) {
  return withClient(async (client) => {
    const handle = await client.workflow.start("transactionSaga", {
      args: [input],
      taskQueue: env.TEMPORAL_TASK_QUEUE,
      workflowId: input.transactionId,
    });
    return { workflowId: handle.workflowId, runId: handle.firstExecutionRunId, status: "STARTED" };
  });
}

export function getTransactionSaga(workflowId: string) {
  return withClient(async (client) => {
    const handle = client.workflow.getHandle(workflowId);
    const description = await handle.describe();
    const status = description.status.name;
    if (status === "COMPLETED") {
      return { workflowId, status, result: await handle.result() };
    }
    return { workflowId, status };
  });
}
