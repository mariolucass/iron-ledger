import { Router } from "express";
import { jwtGuard } from "../../../identity/infra/guards/jwt.guard";
import { requireRoles, SERVICE_ROLE } from "../../../identity/infra/guards/rbac.guard";
import type { InventoryController } from "./inventory.controller";

/** Leitura para qualquer usuário autenticado; escrita restrita (ADMIN tem acesso irrestrito). */
const WRITE_ROLES = ["WAREHOUSE_MANAGER"];

export function createInventoryRouter(controller: InventoryController, jwtSecret: string): Router {
  const router = Router();
  const canMove = requireRoles(...WRITE_ROLES);
  // Reservas também são operadas pela Saga (worker Temporal).
  const canReserve = requireRoles(...WRITE_ROLES, SERVICE_ROLE);
  router.use(jwtGuard(jwtSecret));
  router.get("/", controller.list);
  router.get("/warehouses", controller.warehouses);
  router.get("/:stockLevelId/movements", controller.movements);
  router.get("/reservations/by-transaction/:transactionId", controller.reservationByTransaction);
  router.post("/movements", canMove, controller.createMovement);
  router.post("/reservations", canReserve, controller.createReservation);
  router.post("/reservations/:id/release", canReserve, controller.releaseReservation);
  router.post("/reservations/:id/commit", canReserve, controller.commit);
  return router;
}
