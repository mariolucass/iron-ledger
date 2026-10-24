import { Router } from "express";
import { z } from "zod";
import type { IdentityDirectoryUseCase } from "../../application/identity-directory";
import { jwtGuard, type AuthenticatedRequest } from "../guards/jwt.guard";

export function createAccountSecurityRouter(
  directory: IdentityDirectoryUseCase,
  jwtSecret: string,
) {
  const router = Router();
  router.use(jwtGuard(jwtSecret));
  router.get("/:section", async (request: AuthenticatedRequest, response, next) => {
    try {
      const section = z.enum(["sessions", "security", "api-keys"]).parse(request.params.section);
      response.json(await directory.userSection(request.auth!.userId, section));
    } catch (error) {
      next(error);
    }
  });
  return router;
}
