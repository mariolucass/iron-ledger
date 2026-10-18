import { Router } from "express";
import { jwtGuard } from "../../../identity/infra/guards/jwt.guard";
import type { InventoryController } from "./inventory.controller";

export function createInventoryRouter(controller: InventoryController, jwtSecret: string): Router {
  const router = Router();
  router.use(jwtGuard(jwtSecret));
  router.get("/", controller.list);
  router.get("/warehouses", controller.warehouses);
  router.get("/:stockLevelId/movements", controller.movements);
  router.get("/reservations/by-transaction/:transactionId", controller.reservationByTransaction);
  router.post("/movements", controller.createMovement);
  router.post("/reservations", controller.createReservation);
  router.post("/reservations/:id/release", controller.releaseReservation);
  router.post("/reservations/:id/commit", controller.commit);
  return router;
}
