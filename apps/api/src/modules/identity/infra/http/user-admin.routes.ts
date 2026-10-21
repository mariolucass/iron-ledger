import { Router } from "express";
import { jwtGuard } from "../guards/jwt.guard";
import { requireRoles } from "../guards/rbac.guard";
import type { UserAdminController } from "./user-admin.controller";

/** Administração de acesso: somente papéis com acesso irrestrito (ADMIN). */
export function createUserAdminRouter(controller: UserAdminController, jwtSecret: string): Router {
  const router = Router();
  router.use(jwtGuard(jwtSecret), requireRoles());
  router.get("/", controller.list);
  router.get("/:id", controller.get);
  router.post("/", controller.create);
  router.patch("/:id", controller.update);
  router.put("/:id/roles", controller.setRoles);
  return router;
}

export function createRolesRouter(controller: UserAdminController, jwtSecret: string): Router {
  const router = Router();
  router.use(jwtGuard(jwtSecret), requireRoles());
  router.get("/", controller.roles);
  return router;
}
