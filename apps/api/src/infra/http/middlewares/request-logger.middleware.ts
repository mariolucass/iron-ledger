import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import { runWithContext } from "@iron-ledger/logger";
import { logger } from "../../logger";

export const CORRELATION_HEADER = "x-correlation-id";
const MAX_CORRELATION_LENGTH = 120;

/**
 * Garante um correlation ID por request (reaproveita o do cliente quando válido),
 * devolve-o no header da resposta e o propaga para todos os logs e eventos.
 */
export const requestLogger: RequestHandler = (request, response, next) => {
  const supplied = request.header(CORRELATION_HEADER)?.trim();
  const correlationId = supplied && supplied.length <= MAX_CORRELATION_LENGTH ? supplied : randomUUID();
  request.headers[CORRELATION_HEADER] = correlationId;
  response.setHeader(CORRELATION_HEADER, correlationId);

  const startedAt = process.hrtime.bigint();
  runWithContext({ correlationId, requestId: randomUUID() }, () => {
    response.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const level = response.statusCode >= 500 ? "error" : response.statusCode >= 400 ? "warn" : "info";
      logger[level]({
        http: { method: request.method, path: request.baseUrl + request.path, status: response.statusCode },
        durationMs: Math.round(durationMs * 10) / 10,
      }, "request concluída");
    });
    next();
  });
};
