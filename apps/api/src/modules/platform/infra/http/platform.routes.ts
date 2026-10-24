import { Router } from "express";
import { z } from "zod";
import { handle } from "../../../../infra/http/handle";
import { jwtGuard } from "../../../identity/infra/guards/jwt.guard";
import { requireRoles } from "../../../identity/infra/guards/rbac.guard";
import type { PlatformUseCase } from "../../application/platform";

const id = z.string().uuid();
const pageSchema = z.object({
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
  router.get(
    "/",
    handle(200, () => service.overview()),
  );
  router.get(
    "/services",
    handle(200, (_request, response) => {
      response.set("Cache-Control", "no-store");
      return service.services();
    }),
  );
  router.get(
    "/:section",
    handle(200, (request) => {
      const section = z
        .enum(["outbox", "inbox", "idempotency-keys", "settings", "feature-flags"])
        .parse(request.params.section);
      const query = pageSchema.parse(request.query);
      return service.list(section, query.page, query.pageSize);
    }),
  );
  router.get(
    "/outbox/:id",
    handle(200, (request) => service.outbox(id.parse(request.params.id))),
  );
  router.get(
    "/feature-flags/:id",
    handle(200, (request) => service.flag(id.parse(request.params.id))),
  );
  router.post(
    "/feature-flags",
    handle(201, (request) => service.createFlag(flag.parse(request.body), request.auth!.userId)),
  );
  router.patch(
    "/feature-flags/:id",
    handle(200, (request) =>
      service.updateFlag(
        id.parse(request.params.id),
        flag.partial().parse(request.body),
        request.auth!.userId,
      ),
    ),
  );
  return router;
}
