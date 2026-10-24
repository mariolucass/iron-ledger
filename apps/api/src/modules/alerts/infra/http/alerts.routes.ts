import { Router } from "express";
import { jwtGuard } from "../../../identity/infra/guards/jwt.guard";
import type { AlertsController } from "./alerts.controller";

export function createAlertsRouter(controller: AlertsController, jwtSecret: string): Router {
  const router = Router();
  router.use(jwtGuard(jwtSecret));
  router.get("/", controller.list);
  router.patch("/:id", controller.update);
  router.post("/resolve-all", controller.resolveAll);
  return router;
}
