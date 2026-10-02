import { Router } from "express";
import { jwtGuard } from "../../../identity/infra/guards/jwt.guard";
import type { TransactionController } from "./transaction.controller";

export function createTransactionRouter(controller: TransactionController, jwtSecret: string): Router {
  const router = Router();
  router.use(jwtGuard(jwtSecret));
  router.post("/", controller.start);
  router.get("/:id", controller.get);
  return router;
}
