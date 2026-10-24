import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { EVENT_PRODUCER } from "../../shared/domain/domain-event";
import { jwtGuard } from "../../modules/identity/infra/guards/jwt.guard";
import type { EventBus } from "../messaging/rabbitmq.client";
import { CORRELATION_HEADER } from "./middlewares/request-logger.middleware";
import { handle } from "./handle";

const eventSchema = z.object({
  eventName: z
    .string()
    .min(3)
    .regex(/^[A-Za-z][A-Za-z0-9.]*$/),
  aggregateId: z.string().optional(),
  payload: z.record(z.unknown()).default({}),
});

/** Publica um evento arbitrário direto no broker, para testar consumidores manualmente. */
export function createTestEventRouter(eventBus: EventBus, jwtSecret: string): Router {
  const router = Router();
  router.post(
    "/test",
    jwtGuard(jwtSecret),
    handle(202, async (request) => {
      const input = eventSchema.parse(request.body);
      const event = {
        eventId: randomUUID(),
        eventName: input.eventName,
        eventVersion: 1,
        occurredAt: new Date().toISOString(),
        producer: EVENT_PRODUCER,
        aggregateId: input.aggregateId,
        correlationId: request.header(CORRELATION_HEADER),
        actorId: request.auth?.userId,
        payload: input.payload,
      };
      await eventBus.publish(event);
      return { published: true, exchange: eventBus.exchange, event };
    }),
  );
  return router;
}
