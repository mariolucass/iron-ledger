import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env";
import { prisma } from "../database/prisma.client";
import { logger } from "../logger";
import { EVENT_PRODUCER, type EventBus } from "../messaging/rabbitmq.client";
import { LoginUseCase } from "../../modules/identity/application/use-cases/login.use-case";
import { jwtGuard, type AuthenticatedRequest } from "../../modules/identity/infra/guards/jwt.guard";
import { AuthController } from "../../modules/identity/infra/http/auth.controller";
import { createAuthRouter } from "../../modules/identity/infra/http/auth.routes";
import { PrismaLoginUserRepository } from "../../modules/identity/infra/repositories/prisma-login-user.repository";
import { UpdateStockUseCase } from "../../modules/inventory/application/use-cases/update-stock.use-case";
import { ReserveStockUseCase } from "../../modules/inventory/application/use-cases/reserve-stock.use-case";
import { ReleaseStockUseCase } from "../../modules/inventory/application/use-cases/release-stock.use-case";
import { CommitReservationUseCase } from "../../modules/inventory/application/use-cases/commit-reservation.use-case";
import { InventoryController } from "../../modules/inventory/infra/http/inventory.controller";
import { createInventoryRouter } from "../../modules/inventory/infra/http/inventory.routes";
import { PrismaInventoryRepository } from "../../modules/inventory/infra/repositories/prisma-inventory.repository";
import { QueryAuditUseCase } from "../../modules/audit/application/use-cases/query-audit.use-case";
import { AuditController } from "../../modules/audit/infra/http/audit.controller";
import { createAuditRouter } from "../../modules/audit/infra/http/audit.routes";
import { PrismaAuditRepository } from "../../modules/audit/infra/repositories/prisma-audit.repository";
import type { WorkflowOrchestrator } from "../../modules/transaction/application/ports/workflow-orchestrator.port";
import { QueryTransactionsUseCase } from "../../modules/transaction/application/use-cases/query-transactions.use-case";
import { RecordSagaStepUseCase } from "../../modules/transaction/application/use-cases/record-saga-step.use-case";
import { ReportTransactionOutcomeUseCase } from "../../modules/transaction/application/use-cases/report-transaction-outcome.use-case";
import { StartTransactionUseCase } from "../../modules/transaction/application/use-cases/start-transaction.use-case";
import { TransactionController } from "../../modules/transaction/infra/http/transaction.controller";
import { createTransactionRouter } from "../../modules/transaction/infra/http/transaction.routes";
import { PrismaStockAvailability } from "../../modules/transaction/infra/repositories/prisma-stock-availability";
import { PrismaTransactionRepository } from "../../modules/transaction/infra/repositories/prisma-transaction.repository";

export interface RouterDependencies {
  eventBus: EventBus;
  workflowOrchestrator: WorkflowOrchestrator;
  /** Acorda o relay do outbox após commits com eventos. */
  onEventsCommitted?: () => void;
}

const eventSchema = z.object({
  eventName: z.string().min(3).regex(/^[A-Za-z][A-Za-z0-9.]*$/),
  aggregateId: z.string().optional(),
  payload: z.record(z.unknown()).default({}),
});

export function createRouter({ eventBus, workflowOrchestrator, onEventsCommitted }: RouterDependencies): Router {
  const router = Router();
  const login = new LoginUseCase(
    new PrismaLoginUserRepository(),
    env.JWT_SECRET,
    env.JWT_EXPIRES_IN as never,
  );
  const inventoryRepository = new PrismaInventoryRepository();
  const inventoryController = new InventoryController(
    inventoryRepository,
    new UpdateStockUseCase(inventoryRepository, eventBus),
    new ReserveStockUseCase(inventoryRepository, eventBus),
    new ReleaseStockUseCase(inventoryRepository, eventBus),
    new CommitReservationUseCase(inventoryRepository, eventBus),
  );
  const auditController = new AuditController(new QueryAuditUseCase(new PrismaAuditRepository()));
  const transactionRepository = new PrismaTransactionRepository(prisma, { onEventsCommitted });
  const transactionController = new TransactionController(
    new StartTransactionUseCase(
      transactionRepository,
      transactionRepository,
      new PrismaStockAvailability(prisma),
      workflowOrchestrator,
      logger.child({ component: "transaction" }),
    ),
    new QueryTransactionsUseCase(transactionRepository),
    new RecordSagaStepUseCase(transactionRepository),
    new ReportTransactionOutcomeUseCase(transactionRepository, transactionRepository),
  );

  router.get("/health", (_request, response) => {
    response.json({ status: "ok", service: "iron-ledger-api", timestamp: new Date().toISOString() });
  });
  router.use("/auth", createAuthRouter(new AuthController(login)));
  router.use("/inventory", createInventoryRouter(inventoryController, env.JWT_SECRET));
  router.get("/warehouses", jwtGuard(env.JWT_SECRET), inventoryController.warehouses);
  router.use("/audit", createAuditRouter(auditController, env.JWT_SECRET));
  router.use("/transactions", createTransactionRouter(transactionController, env.JWT_SECRET));

  router.post("/events/test", jwtGuard(env.JWT_SECRET), async (request: AuthenticatedRequest, response, next) => {
    try {
      const input = eventSchema.parse(request.body);
      const event = {
        eventId: randomUUID(),
        eventName: input.eventName,
        eventVersion: 1,
        occurredAt: new Date().toISOString(),
        producer: EVENT_PRODUCER,
        aggregateId: input.aggregateId,
        correlationId: request.header("x-correlation-id"),
        actorId: request.auth?.userId,
        payload: input.payload,
      };
      await eventBus.publish(event);
      response.status(202).json({ published: true, exchange: eventBus.exchange, event });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
