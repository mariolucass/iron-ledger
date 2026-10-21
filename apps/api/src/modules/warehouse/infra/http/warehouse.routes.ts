import { Router } from "express";
import { jwtGuard } from "../../../identity/infra/guards/jwt.guard";
import { requireRoles } from "../../../identity/infra/guards/rbac.guard";
import type { WarehouseController } from "./warehouse.controller";

/** Leitura para qualquer usuário autenticado; escrita restrita (ADMIN tem acesso irrestrito). */
const WRITE_ROLES = ["WAREHOUSE_MANAGER"];

export function createWarehouseRouter(controller: WarehouseController, jwtSecret: string): Router {
  const router = Router();
  const canWrite = requireRoles(...WRITE_ROLES);
  router.use(jwtGuard(jwtSecret));
  router.get("/", controller.list);
  router.get("/:id", controller.get);
  router.post("/", canWrite, controller.create);
  router.patch("/:id", canWrite, controller.update);
  router.delete("/:id", canWrite, controller.deactivate);
  router.post("/:id/locations", canWrite, controller.addLocation);
  router.patch("/:id/locations/:locationId", canWrite, controller.patchLocation);
  return router;
}
