import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createHealthRouter } from "./health.routes";

const servers: { close(): void }[] = [];
afterEach(() => servers.splice(0).forEach((server) => server.close()));

function start(queryRaw: () => Promise<unknown>) {
  const app = express();
  app.use("/health", createHealthRouter({ $queryRaw: vi.fn(queryRaw) } as never));
  const server = app.listen(0);
  servers.push(server);
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}/health`;
}

describe("health", () => {
  it("liveness responde ok sem consultar dependências", async () => {
    const queryRaw = vi.fn();
    const response = await fetch(start(queryRaw));
    expect(response.status).toBe(200);
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it("readiness responde 200 com o banco no ar", async () => {
    const response = await fetch(`${start(async () => [{ "?column?": 1 }])}/ready`);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      status: "ok",
      checks: { database: { status: "up" } },
    });
  });

  it("readiness responde 503 com o banco fora", async () => {
    const response = await fetch(
      `${start(async () => Promise.reject(new Error("ECONNREFUSED")))}/ready`,
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      status: "degraded",
      checks: { database: { status: "down" } },
    });
  });
});
