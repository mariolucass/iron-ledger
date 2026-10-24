import type { AddressInfo } from "node:net";
import express, { type RequestHandler } from "express";
import { afterEach, describe, expect, it } from "vitest";
import { errorHandler } from "./error-handler.middleware";
import { byBodyEmail, rateLimit } from "./rate-limit.middleware";

const servers: { close(): void }[] = [];
afterEach(() => servers.splice(0).forEach((server) => server.close()));

/** App mínimo: o limiter na frente de uma rota que responde com o status pedido no corpo. */
function start(limiter: RequestHandler) {
  const app = express();
  app.use(express.json());
  app.post("/", limiter, (request, response) => {
    response.status(request.body.status ?? 200).json({ ok: true });
  });
  app.use(errorHandler);
  const server = app.listen(0);
  servers.push(server);
  const { port } = server.address() as AddressInfo;
  return (body: Record<string, unknown> = {}) =>
    fetch(`http://127.0.0.1:${port}/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
}

describe("rateLimit", () => {
  it("responde 429 com Retry-After ao exceder o limite e libera após a janela", async () => {
    let now = 0;
    const call = start(
      rateLimit({ max: 2, windowMs: 60_000, message: "Calma.", key: () => "ip", now: () => now }),
    );

    const first = await call();
    expect(first.status).toBe(200);
    expect(first.headers.get("ratelimit-remaining")).toBe("1");
    expect((await call()).status).toBe(200);

    const blocked = await call();
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBe("60");
    expect(await blocked.json()).toEqual({ error: "RATE_LIMITED", message: "Calma." });

    now = 60_000;
    expect((await call()).status).toBe(200);
  });

  it("com failuresOnly, só respostas de erro consomem tentativas", async () => {
    const call = start(
      rateLimit({
        max: 2,
        windowMs: 60_000,
        message: "Calma.",
        key: () => "ip",
        failuresOnly: true,
      }),
    );

    for (let i = 0; i < 5; i += 1) expect((await call()).status).toBe(200);
    expect((await call({ status: 401 })).status).toBe(401);
    expect((await call({ status: 401 })).status).toBe(401);
    expect((await call()).status).toBe(429);
  });

  it("separa contadores por chave e ignora requests sem chave", async () => {
    const call = start(
      rateLimit({ max: 1, windowMs: 60_000, message: "Calma.", key: byBodyEmail }),
    );

    expect((await call({ email: "Ana@Example.com" })).status).toBe(200);
    expect((await call({ email: " ana@example.com " })).status).toBe(429);
    expect((await call({ email: "bia@example.com" })).status).toBe(200);
    expect((await call()).status).toBe(200);
    expect((await call()).status).toBe(200);
  });
});
