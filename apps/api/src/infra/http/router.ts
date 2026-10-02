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
import { createInventoryRouter } from "../../modules/inventory/infra/http/inventory.routes";

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

  router.get("/health", (_request, response) => {
    response.json({ status: "ok", service: "iron-ledger-api", timestamp: new Date().toISOString() });
  });
  router.use("/auth", createAuthRouter(new AuthController(login)));
  router.use("/inventory", createInventoryRouter());

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
