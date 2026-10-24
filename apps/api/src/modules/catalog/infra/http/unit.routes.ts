import { Router } from "express";
import { handle } from "../../../../infra/http/handle";
import { jwtGuard } from "../../../identity/infra/guards/jwt.guard";
import { requireRoles } from "../../../identity/infra/guards/rbac.guard";
import { createUnitSchema, listUnitsSchema } from "../../application/unit-of-measure";
import type {
  CreateUnitUseCase,
  ListUnitsUseCase,
} from "../../application/unit-of-measure.use-cases";

export function createUnitRouter(
  list: ListUnitsUseCase,
  create: CreateUnitUseCase,
  jwtSecret: string,
): Router {
  const router = Router();
  router.use(jwtGuard(jwtSecret));
  router.get(
    "/",
    handle(200, (request) => list.execute(listUnitsSchema.parse(request.query))),
  );
  router.post(
    "/",
    requireRoles("CATALOG_MANAGER"),
    handle(201, (request) => create.execute(createUnitSchema.parse(request.body))),
  );
  return router;
}
