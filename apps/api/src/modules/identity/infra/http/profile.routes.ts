import { Router } from "express";
import { jwtGuard } from "../guards/jwt.guard";
import type { ProfileController } from "./profile.controller";

export function createProfileRouter(controller: ProfileController, jwtSecret: string): Router {
  const router = Router();
  router.use(jwtGuard(jwtSecret));
  router.get("/", controller.me);
  router.patch("/", controller.patchMe);
  router.patch("/preferences", controller.patchPreferences);
  router.post("/password", controller.postPassword);
  return router;
}
