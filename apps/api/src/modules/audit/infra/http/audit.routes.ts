import { Router } from "express";
import { jwtGuard } from "../../../identity/infra/guards/jwt.guard";
import type { AuditController } from "./audit.controller";

export function createAuditRouter(controller: AuditController, jwtSecret: string): Router {
  const router = Router();
  router.use(jwtGuard(jwtSecret));
  router.get("/", controller.list);
  return router;
}
