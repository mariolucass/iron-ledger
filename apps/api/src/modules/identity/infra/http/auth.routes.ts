import { Router } from "express";
import {
  byBodyEmail,
  byIp,
  rateLimit,
} from "../../../../infra/http/middlewares/rate-limit.middleware";
import type { AuthController } from "./auth.controller";

const WINDOW_MS = 15 * 60 * 1000;
const TOO_MANY_ATTEMPTS = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();
  // O IP pode ser forjado quando o proxy da borda não sobrescreve `X-Forwarded-For`;
  // o limite por e-mail é o que protege cada conta contra força bruta.
  const loginByIp = rateLimit({
    max: 20,
    windowMs: WINDOW_MS,
    message: TOO_MANY_ATTEMPTS,
    key: byIp,
    failuresOnly: true,
  });
  const loginByEmail = rateLimit({
    max: 10,
    windowMs: WINDOW_MS,
    message: TOO_MANY_ATTEMPTS,
    key: (request) => {
      const email = byBodyEmail(request);
      return email && `login:${email}`;
    },
    failuresOnly: true,
  });
  const registerByIp = rateLimit({
    max: 10,
    windowMs: WINDOW_MS,
    message: TOO_MANY_ATTEMPTS,
    key: byIp,
  });

  router.post("/login", loginByIp, loginByEmail, controller.handleLogin);
  router.post("/register", registerByIp, controller.handleRegister);
  return router;
}
