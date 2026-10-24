import express, { Router } from "express";
import { jwtGuard } from "../../../identity/infra/guards/jwt.guard";
import { requireRoles } from "../../../identity/infra/guards/rbac.guard";
import type { ProductImportController } from "./product-import.controller";
import type { ProductController } from "./product.controller";

/** Leitura para qualquer usuário autenticado; escrita restrita (ADMIN tem acesso irrestrito). */
const WRITE_ROLES = ["CATALOG_MANAGER"];

/** Planilhas de até 5.000 linhas passam do limite global de 1 MB. */
export const PRODUCT_IMPORT_PATH = "/products/imports";
export const productImportBody = express.json({ limit: "10mb" });

export function createProductRouter(controller: ProductController, imports: ProductImportController, jwtSecret: string): Router {
  const router = Router();
  router.use(jwtGuard(jwtSecret));
  router.post("/imports/preview", requireRoles(...WRITE_ROLES), imports.preview);
  router.post("/imports/commit", requireRoles(...WRITE_ROLES), imports.commit);
  router.get("/", controller.list);
  router.get("/lookups", controller.lookups);
  router.get("/:id", controller.get);
  router.get("/:id/:section", controller.section);
  router.post("/", requireRoles(...WRITE_ROLES), controller.create);
  router.patch("/:id", requireRoles(...WRITE_ROLES), controller.update);
  router.delete("/:id", requireRoles(...WRITE_ROLES), controller.archive);
  return router;
}
