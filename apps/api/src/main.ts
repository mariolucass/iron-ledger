import { env } from "./config/env";
import { prisma } from "./infra/database/prisma.client";
import { createServer } from "./infra/http/server";
import { logger } from "./infra/logger";
import { createEventBus } from "./infra/messaging/rabbitmq.client";
import { OutboxRelay } from "./infra/outbox/outbox.relay";
import { RecordAuditUseCase } from "./modules/audit/application/use-cases/record-audit.use-case";
import { startDomainEventConsumer } from "./modules/audit/infra/consumers/domain-event.consumer";
import { PrismaAuditRepository } from "./modules/audit/infra/repositories/prisma-audit.repository";
import { TemporalWorkflowOrchestrator } from "./modules/transaction/infra/temporal/transaction-saga.starter";

/** Abaixo do grace period padrão do `docker stop` (10 s), para o log sair antes do SIGKILL. */
const SHUTDOWN_TIMEOUT_MS = 8_000;

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "Promise rejeitada sem tratamento");
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "Exceção não capturada");
  process.exit(1);
});

async function bootstrap(): Promise<void> {
  const eventBus = createEventBus(env.EVENT_BUS, env.RABBITMQ_URL);
  const workflowOrchestrator = new TemporalWorkflowOrchestrator({
    address: env.TEMPORAL_ADDRESS,
    namespace: env.TEMPORAL_NAMESPACE,
    taskQueue: env.TEMPORAL_TASK_QUEUE,
  });
  await prisma.$connect();
  await eventBus.connect();
  await startDomainEventConsumer(eventBus, new RecordAuditUseCase(new PrismaAuditRepository()));

  const outboxRelay = new OutboxRelay(
    prisma,
    eventBus,
    logger.child({ component: "outbox-relay" }),
    {
      pollIntervalMs: env.OUTBOX_POLL_INTERVAL_MS,
    },
  );
  if (env.OUTBOX_RELAY_ENABLED) outboxRelay.start();

  const server = createServer({
    eventBus,
    workflowOrchestrator,
    onEventsCommitted: () => outboxRelay.wake(),
    temporalHealth: () => workflowOrchestrator.health(),
  }).listen(env.PORT, "0.0.0.0", () => {
    logger.info(
      { port: env.PORT, eventBus: env.EVENT_BUS, outboxRelay: env.OUTBOX_RELAY_ENABLED },
      `iron-ledger API disponível em http://localhost:${env.PORT}`,
    );
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "Encerrando a API");
    const forceExit = setTimeout(() => {
      logger.fatal(
        { signal, timeoutMs: SHUTDOWN_TIMEOUT_MS },
        "Encerramento excedeu o prazo; saindo à força",
      );
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    server.close(async () => {
      try {
        await outboxRelay.stop();
        await workflowOrchestrator.close();
        await eventBus.close();
        await prisma.$disconnect();
        process.exit(0);
      } catch (error) {
        logger.error({ err: error }, "Falha ao liberar recursos no encerramento");
        process.exit(1);
      }
    });
    // Conexões keep-alive ociosas impediriam o `close` de terminar.
    server.closeIdleConnections();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch(async (error) => {
  logger.fatal({ err: error }, "Falha ao iniciar a API");
  await prisma.$disconnect();
  process.exit(1);
});
