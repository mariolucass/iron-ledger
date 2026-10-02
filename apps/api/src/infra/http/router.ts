import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env";
import type { RabbitMqClient } from "../messaging/rabbitmq.client";
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
import { TransactionController } from "../../modules/transaction/infra/http/transaction.controller";
import { createTransactionRouter } from "../../modules/transaction/infra/http/transaction.routes";

const eventSchema = z.object({
  eventName: z.string().min(3).regex(/^[A-Za-z][A-Za-z0-9.]*$/),
  aggregateId: z.string().optional(),
  payload: z.record(z.unknown()).default({}),
});

export function createRouter(rabbitMq: RabbitMqClient): Router {
  const router = Router();
  const login = new LoginUseCase(
    new PrismaLoginUserRepository(),
    env.JWT_SECRET,
    env.JWT_EXPIRES_IN as never,
  );
  const inventoryRepository = new PrismaInventoryRepository();
  const inventoryController = new InventoryController(
    inventoryRepository,
    new UpdateStockUseCase(inventoryRepository, rabbitMq),
    new ReserveStockUseCase(inventoryRepository, rabbitMq),
    new ReleaseStockUseCase(inventoryRepository, rabbitMq),
    new CommitReservationUseCase(inventoryRepository, rabbitMq),
  );
  const auditController = new AuditController(new QueryAuditUseCase(new PrismaAuditRepository()));

  router.get("/health", (_request, response) => {
    response.json({ status: "ok", service: "iron-ledger-api", timestamp: new Date().toISOString() });
  });
  router.use("/auth", createAuthRouter(new AuthController(login)));
  router.use("/inventory", createInventoryRouter(inventoryController, env.JWT_SECRET));
  router.get("/warehouses", jwtGuard(env.JWT_SECRET), inventoryController.warehouses);
  router.use("/audit", createAuditRouter(auditController, env.JWT_SECRET));
  router.use("/transactions", createTransactionRouter(new TransactionController(), env.JWT_SECRET));

  router.post("/events/test", jwtGuard(env.JWT_SECRET), async (request: AuthenticatedRequest, response, next) => {
    try {
      const input = eventSchema.parse(request.body);
      const event = {
        eventId: randomUUID(),
        eventName: input.eventName,
        occurredAt: new Date().toISOString(),
        aggregateId: input.aggregateId,
        actorId: request.auth?.userId,
        payload: input.payload,
      };
      await rabbitMq.publish(event);
      response.status(202).json({ published: true, exchange: rabbitMq.exchange, event });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
