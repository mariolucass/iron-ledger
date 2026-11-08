import type { Logger } from "@iron-ledger/logger";
import type { ApiClient } from "./http/api-client";

/** O que o worker entrega a cada módulo na hora de montar suas activities. */
export interface ModuleContext {
  api: ApiClient;
  logger: Logger;
  env: NodeJS.ProcessEnv;
  /** O workflowId da activity em execução (ID da transação): correlaciona as chamadas à API. */
  correlationId(): string | undefined;
}

/**
 * Contrato de um módulo do worker. Cada `modules/<nome>/module.ts` exporta um
 * `workerModule`; o bootstrap descobre os módulos sozinho, então adicionar um não
 * exige editar nenhum arquivo compartilhado.
 *
 * Workflows ficam em `modules/<nome>/workflows/index.ts` e também são descobertos.
 */
export interface WorkerModule {
  /** Igual ao nome da pasta do módulo. */
  readonly name: string;
  /** Nomes de activities são globais na task queue e fazem parte do histórico do Temporal. */
  createActivities(context: ModuleContext): object;
}
