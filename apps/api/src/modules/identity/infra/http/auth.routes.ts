import { Router } from "express";
import type { AuthController } from "./auth.controller";

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();
  router.post("/login", controller.handleLogin);
  router.post("/register", controller.handleRegister);
  return router;
}
