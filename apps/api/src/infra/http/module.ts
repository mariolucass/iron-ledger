import type { Logger } from "@iron-ledger/logger";
import type { PrismaClient } from "@prisma/client";
import type { Router } from "express";
import type { env } from "../../config/env";
import type { WorkflowOrchestrator } from "../../modules/transaction/application/ports/workflow-orchestrator.port";
import type { EventBus } from "../messaging/rabbitmq.client";

/** Dependências de processo que `main.ts` entrega à camada HTTP. */
export interface RouterDependencies {
  eventBus: EventBus;
  workflowOrchestrator: WorkflowOrchestrator;
  /** Acorda o relay do outbox após commits com eventos. */
  onEventsCommitted?: () => void;
  /** Saúde do Temporal para o painel de serviços; ausente, o Temporal aparece desativado. */
  temporalHealth?: () => Promise<{ pollers: number }>;
}

/** Tudo o que um módulo pode usar para compor seus casos de uso e rotas. */
export interface ModuleContext extends RouterDependencies {
  env: typeof env;
  prisma: PrismaClient;
  logger: Logger;
}

/** Rotas de um bounded context, montadas pelo router na ordem declarada. */
export interface HttpModule {
  path: string;
  router: Router;
}

export type ModuleFactory = (context: ModuleContext) => HttpModule[];
