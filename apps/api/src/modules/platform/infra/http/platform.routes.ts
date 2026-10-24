import { Router } from "express";
import { z } from "zod";
import { jwtGuard, type AuthenticatedRequest } from "../../../identity/infra/guards/jwt.guard";
import { requireRoles } from "../../../identity/infra/guards/rbac.guard";
import type { PlatformUseCase } from "../../application/platform";
const id = z.string().uuid();
const paging = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
const flag = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9][a-z0-9._-]*$/),
  description: z.string().trim().max(500).nullable(),
  isEnabled: z.boolean(),
  rollout: z.number().int().min(0).max(100),
  rules: z.unknown().nullable(),
});
export function createPlatformRouter(service: PlatformUseCase, jwtSecret: string) {
  const router = Router();
  router.use(jwtGuard(jwtSecret), requireRoles());
  router.get("/", async (_request, response, next) => {
    try {
      response.json(await service.overview());
    } catch (error) {
      next(error);
    }
  });
  router.get("/services", async (_request, response, next) => {
    try {
      response.set("Cache-Control", "no-store").json(await service.services());
    } catch (error) {
      next(error);
    }
  });
  router.get("/:section", async (request, response, next) => {
    try {
      const section = z
        .enum(["outbox", "inbox", "idempotency-keys", "settings", "feature-flags"])
        .parse(request.params.section);
      const query = paging.parse(request.query);
      response.json(await service.list(section, query.page, query.pageSize));
    } catch (error) {
      next(error);
    }
  });
  router.get("/outbox/:id", async (request, response, next) => {
    try {
      response.json(await service.outbox(id.parse(request.params.id)));
    } catch (error) {
      next(error);
    }
  });
  router.get("/feature-flags/:id", async (request, response, next) => {
    try {
      response.json(await service.flag(id.parse(request.params.id)));
    } catch (error) {
      next(error);
    }
  });
  router.post("/feature-flags", async (request: AuthenticatedRequest, response, next) => {
    try {
      response
        .status(201)
        .json(await service.createFlag(flag.parse(request.body), request.auth!.userId));
    } catch (error) {
      next(error);
    }
  });
  router.patch("/feature-flags/:id", async (request: AuthenticatedRequest, response, next) => {
    try {
      response.json(
        await service.updateFlag(
          id.parse(request.params.id),
          flag.partial().parse(request.body),
          request.auth!.userId,
        ),
      );
    } catch (error) {
      next(error);
    }
  });
  return router;
}
