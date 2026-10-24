import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type AuthenticatedRequest = Request & {
  auth?: { userId: string; email: string; roles: string[] };
};

export function jwtGuard(secret: string) {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction): void => {
    const [scheme, token] = request.headers.authorization?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token) {
      response.status(401).json({ error: "UNAUTHORIZED", message: "Token Bearer ausente" });
      return;
    }

    try {
      const payload = jwt.verify(token, secret, {
        issuer: "iron-ledger-api",
        algorithms: ["HS256"],
      });
      if (typeof payload === "string" || !payload.sub) throw new Error("Invalid payload");
      request.auth = {
        userId: payload.sub,
        email: String(payload.email),
        roles: Array.isArray(payload.roles) ? payload.roles.map(String) : [],
      };
      next();
    } catch {
      response.status(401).json({ error: "INVALID_TOKEN", message: "Token inválido ou expirado" });
    }
  };
}
