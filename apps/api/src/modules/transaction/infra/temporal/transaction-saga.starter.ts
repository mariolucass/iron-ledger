import type { TransactionSagaInput, TransactionSagaResult } from "@iron-ledger/workflow-contracts";
import { Client, Connection, WorkflowExecutionAlreadyStartedError } from "@temporalio/client";
import { AppError } from "../../../../shared/errors/domain.error";
import type { StartedWorkflow, WorkflowOrchestrator } from "../../application/ports/workflow-orchestrator.port";

type TransactionWorkflow = (input: TransactionSagaInput) => Promise<TransactionSagaResult>;

/** Nome registrado pelo worker (apps/temporal-worker/src/workflows). */
export const TRANSACTION_SAGA_WORKFLOW = "transactionSaga";

export interface TemporalOptions {
  address: string;
  namespace: string;
  taskQueue: string;
}

/**
 * Adaptador Temporal da porta `WorkflowOrchestrator`. Mantém uma única conexão
 * gRPC (criada sob demanda e recriada após falha), em vez de uma por request.
 */
export class TemporalWorkflowOrchestrator implements WorkflowOrchestrator {
  private client?: Promise<Client>;
  private connection?: Connection;

  constructor(private readonly options: TemporalOptions) {}

  async startTransactionSaga(workflowId: string, input: TransactionSagaInput): Promise<StartedWorkflow> {
    const client = await this.getClient();
    try {
      const handle = await client.workflow.start<TransactionWorkflow>(TRANSACTION_SAGA_WORKFLOW, {
        args: [input],
        taskQueue: this.options.taskQueue,
        workflowId,
        // Nunca reutilizar o ID: a transação é única e a reserva depende dele.
        workflowIdReusePolicy: "REJECT_DUPLICATE",
        memo: { correlationId: input.correlationId ?? null },
      });
      return { workflowId: handle.workflowId, runId: handle.firstExecutionRunId, created: true };
    } catch (error) {
      if (error instanceof WorkflowExecutionAlreadyStartedError) {
        const description = await client.workflow.getHandle(workflowId).describe();
        return { workflowId, runId: description.runId, created: false };
      }
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.connection?.close();
    this.connection = undefined;
    this.client = undefined;
  }

  private getClient(): Promise<Client> {
    this.client ??= Connection.connect({ address: this.options.address, connectTimeout: "5 seconds" })
      .then((connection) => {
        this.connection = connection;
        return new Client({ connection, namespace: this.options.namespace });
      })
      .catch((error: unknown) => {
        this.client = undefined;
        throw Object.assign(new AppError("Temporal está indisponível.", 503, "TEMPORAL_UNAVAILABLE"), { cause: error });
      });
    return this.client;
  }
}
