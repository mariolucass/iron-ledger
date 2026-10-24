import type { Request, RequestHandler } from "express";
import { AppError } from "../../../shared/errors/domain.error";

export interface RateLimitOptions {
  /** Tentativas permitidas por chave dentro da janela. */
  max: number;
  windowMs: number;
  message: string;
  /** Chave do contador; `undefined` deixa a request passar sem contar. */
  key: (request: Request) => string | undefined;
  /** Conta só respostas de erro (status >= 400), como tentativas de login falhas. */
  failuresOnly?: boolean;
  now?: () => number;
}

type Window = { count: number; reset: number };

/**
 * Janela fixa por chave, em memória: vale para uma instância da API. Com mais
 * réplicas, o contador precisa ir para um store compartilhado (ex.: Redis).
 * Responde 429 com `Retry-After` e os headers `RateLimit-*` (draft IETF).
 */
export function rateLimit({
  max,
  windowMs,
  message,
  key,
  failuresOnly = false,
  now = Date.now,
}: RateLimitOptions): RequestHandler {
  const windows = new Map<string, Window>();

  return (request, response, next) => {
    const id = key(request);
    if (id === undefined) {
      next();
      return;
    }

    const current = now();
    // Todas as janelas têm a mesma duração e entram em ordem de criação, então
    // as expiradas estão no início do Map.
    for (const [windowKey, window] of windows) {
      if (window.reset > current) break;
      windows.delete(windowKey);
    }

    let window = windows.get(id);
    if (!window) {
      window = { count: 0, reset: current + windowMs };
      windows.set(id, window);
    }
    const retryAfter = String(Math.ceil((window.reset - current) / 1000));
    response.set({ "RateLimit-Limit": String(max), "RateLimit-Reset": retryAfter });

    if (window.count >= max) {
      response.set({ "RateLimit-Remaining": "0", "Retry-After": retryAfter });
      next(new AppError(message, 429, "RATE_LIMITED"));
      return;
    }

    window.count += 1;
    response.set("RateLimit-Remaining", String(max - window.count));
    if (failuresOnly) {
      const counted = window;
      response.on("finish", () => {
        if (response.statusCode < 400) counted.count = Math.max(0, counted.count - 1);
      });
    }
    next();
  };
}

/** IP do cliente; atrás de proxies, depende do `trust proxy` configurado no app. */
export const byIp = (request: Request): string =>
  request.ip ?? request.socket.remoteAddress ?? "unknown";

/** E-mail normalizado do corpo JSON (login/cadastro); ausente, não limita. */
export const byBodyEmail = (request: Request): string | undefined => {
  const email: unknown = request.body?.email;
  return typeof email === "string" && email.trim() ? email.trim().toLowerCase() : undefined;
};
