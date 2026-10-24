import { Router } from "express";
import { jwtGuard } from "../../../identity/infra/guards/jwt.guard";
import { requireRoles } from "../../../identity/infra/guards/rbac.guard";
import { createUnitSchema, listUnitsSchema } from "../../application/unit-of-measure";
import type { CreateUnitUseCase, ListUnitsUseCase } from "../../application/unit-of-measure.use-cases";

export function createUnitRouter(list: ListUnitsUseCase, create: CreateUnitUseCase, jwtSecret: string): Router {
  const router = Router();
  router.use(jwtGuard(jwtSecret));
  router.get("/", async (request, response, next) => {
    try { response.json(await list.execute(listUnitsSchema.parse(request.query))); } catch (error) { next(error); }
  });
  router.post("/", requireRoles("CATALOG_MANAGER"), async (request, response, next) => {
    try { response.status(201).json(await create.execute(createUnitSchema.parse(request.body))); } catch (error) { next(error); }
  });
  return router;
}
