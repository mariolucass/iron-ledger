import type { PrismaClient } from "@prisma/client";
import { Router } from "express";

const DATABASE_TIMEOUT_MS = 2_000;

/**
 * `/health`: o processo responde (liveness, usado pelo healthcheck do Docker).
 * `/health/ready`: as dependências obrigatórias respondem (readiness); 503 quando
 * o PostgreSQL está fora, para o orquestrador tirar a instância do balanceamento.
 */
export function createHealthRouter(prisma: Pick<PrismaClient, "$queryRaw">): Router {
  const router = Router();

  router.get("/", (_request, response) => {
    response.json({
      status: "ok",
      service: "iron-ledger-api",
      timestamp: new Date().toISOString(),
    });
  });

  router.get("/ready", async (_request, response) => {
    const startedAt = performance.now();
    let database: "up" | "down" = "up";
    try {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_resolve, reject) =>
          setTimeout(() => reject(new Error("timeout")), DATABASE_TIMEOUT_MS).unref(),
        ),
      ]);
    } catch {
      database = "down";
    }
    const status = database === "up" ? "ok" : "degraded";
    response
      .status(status === "ok" ? 200 : 503)
      .set("Cache-Control", "no-store")
      .json({
        status,
        service: "iron-ledger-api",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
        checks: {
          database: { status: database, responseTimeMs: Math.round(performance.now() - startedAt) },
        },
      });
  });

  return router;
}
