import { Router } from "express";
import { jwtGuard, type AuthenticatedRequest } from "../guards/jwt.guard";
import type { AuthController } from "./auth.controller";

export function createAuthRouter(controller: AuthController, jwtSecret: string): Router {
  const router = Router();
  router.post("/login", controller.handleLogin);
  router.get("/session", jwtGuard(jwtSecret), (request: AuthenticatedRequest, response) => {
    response.json({ user: request.auth });
  });
  return router;
}
