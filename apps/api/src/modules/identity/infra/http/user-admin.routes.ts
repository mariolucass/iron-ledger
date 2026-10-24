import { Router } from "express";
import { jwtGuard } from "../guards/jwt.guard";
import { requireRoles } from "../guards/rbac.guard";
import type { UserAdminController } from "./user-admin.controller";

/** Administração de acesso: somente papéis com acesso irrestrito (ADMIN). */
export function createUserAdminRouter(controller: UserAdminController, jwtSecret: string): Router {
  const router = Router();
  router.use(jwtGuard(jwtSecret), requireRoles());
  router.get("/", controller.list);
  router.get("/invitations", controller.invitations);
  router.get("/:id", controller.get);
  router.get("/:id/:section", controller.userSection);
  router.post("/", controller.create);
  router.patch("/:id", controller.update);
  router.put("/:id/roles", controller.setRoles);
  return router;
}

export function createRolesRouter(controller: UserAdminController, jwtSecret: string): Router {
  const router = Router();
  router.use(jwtGuard(jwtSecret), requireRoles());
  router.get("/", controller.roles);
  router.get("/permissions", controller.permissions);
  router.get("/:id", controller.role);
  router.get("/:id/:section", controller.roleSection);
  router.post("/", controller.createRole);
  router.patch("/:id", controller.updateRole);
  return router;
}
