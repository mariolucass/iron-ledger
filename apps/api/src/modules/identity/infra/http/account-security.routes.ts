import { Router } from "express";
import { z } from "zod";
import { handle } from "../../../../infra/http/handle";
import type { IdentityDirectoryUseCase } from "../../application/identity-directory";
import { jwtGuard } from "../guards/jwt.guard";

export function createAccountSecurityRouter(
  directory: IdentityDirectoryUseCase,
  jwtSecret: string,
) {
  const router = Router();
  router.use(jwtGuard(jwtSecret));
  router.get(
    "/:section",
    handle(200, (request) => {
      const section = z.enum(["sessions", "security", "api-keys"]).parse(request.params.section);
      return directory.userSection(request.auth!.userId, section);
    }),
  );
  return router;
}
