import { Router } from "express";
import { jwtGuard } from "../../../identity/infra/guards/jwt.guard";
import { requireRoles } from "../../../identity/infra/guards/rbac.guard";
import type { ProductController } from "./product.controller";

/** Leitura para qualquer usuário autenticado; escrita restrita (ADMIN tem acesso irrestrito). */
const WRITE_ROLES = ["CATALOG_MANAGER"];

export function createProductRouter(controller: ProductController, jwtSecret: string): Router {
  const router = Router();
  router.use(jwtGuard(jwtSecret));
  router.get("/", controller.list);
  router.get("/lookups", controller.lookups);
  router.get("/:id", controller.get);
  router.post("/", requireRoles(...WRITE_ROLES), controller.create);
  router.patch("/:id", requireRoles(...WRITE_ROLES), controller.update);
  router.delete("/:id", requireRoles(...WRITE_ROLES), controller.archive);
  return router;
}
