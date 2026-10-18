import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./jwt.guard";

/** Papéis com acesso irrestrito. */
const SUPER_ROLES = new Set(["ADMIN"]);

/**
 * Exige ao menos um dos papéis informados. Deve ser usado depois do `jwtGuard`.
 * Permissões finas (`recurso:ação`) virão da tabela `identity.permissions`.
 */
export function requireRoles(...roles: string[]) {
  const allowed = new Set(roles);
  return (request: AuthenticatedRequest, response: Response, next: NextFunction): void => {
    const granted = request.auth?.roles ?? [];
    if (granted.some((role) => SUPER_ROLES.has(role) || allowed.has(role))) {
      next();
      return;
    }
    response.status(403).json({ error: "FORBIDDEN", message: "Permissão insuficiente para esta operação." });
  };
}
