import { Router } from "express";
import { jwtGuard } from "../../../identity/infra/guards/jwt.guard";
import { requireRoles } from "../../../identity/infra/guards/rbac.guard";
import type { TransactionController } from "./transaction.controller";

/** Papel atribuído a identidades de serviço (worker Temporal). ADMIN também é aceito. */
export const SAGA_WORKER_ROLE = "SERVICE";

export function createTransactionRouter(controller: TransactionController, jwtSecret: string): Router {
  const router = Router();
  router.use(jwtGuard(jwtSecret));
  router.get("/", controller.list);
  router.post("/", controller.start);
  router.get("/:id", controller.get);
  router.post("/:id/steps", requireRoles(SAGA_WORKER_ROLE), controller.steps);
  router.post("/:id/outcome", requireRoles(SAGA_WORKER_ROLE), controller.outcome);
  return router;
}
