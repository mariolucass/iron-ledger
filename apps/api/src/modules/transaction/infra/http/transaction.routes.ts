import { Router } from "express";
import { jwtGuard } from "../../../identity/infra/guards/jwt.guard";
import { requireRoles, SERVICE_ROLE } from "../../../identity/infra/guards/rbac.guard";
import type { TransactionController } from "./transaction.controller";

export function createTransactionRouter(
  controller: TransactionController,
  jwtSecret: string,
): Router {
  const router = Router();
  router.use(jwtGuard(jwtSecret));
  router.get("/", controller.list);
  router.post("/", controller.start);
  router.get("/:id", controller.get);
  router.post("/:id/steps", requireRoles(SERVICE_ROLE), controller.steps);
  router.post("/:id/outcome", requireRoles(SERVICE_ROLE), controller.outcome);
  return router;
}
