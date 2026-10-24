import { Router } from "express";
import { jwtGuard } from "../../../identity/infra/guards/jwt.guard";
import { requireRoles } from "../../../identity/infra/guards/rbac.guard";
import type { AlertsController } from "./alerts.controller";

/** Leitura para qualquer usuário autenticado; tratar alertas é operação do armazém (ADMIN tem acesso irrestrito). */
const WRITE_ROLES = ["WAREHOUSE_MANAGER"];

export function createAlertsRouter(controller: AlertsController, jwtSecret: string): Router {
  const router = Router();
  const canWrite = requireRoles(...WRITE_ROLES);
  router.use(jwtGuard(jwtSecret));
  router.get("/", controller.list);
  router.patch("/:id", canWrite, controller.update);
  router.post("/resolve-all", canWrite, controller.resolveAll);
  return router;
}
