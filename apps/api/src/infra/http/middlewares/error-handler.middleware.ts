import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../../../shared/errors/domain.error";
import { logger } from "../../logger";
import { CORRELATION_HEADER } from "./request-logger.middleware";

/** Erros do `express.json` (http-errors): status 4xx com `type` conhecido. */
type BodyParserError = { status: number; type: string; expose: boolean };

const BODY_ERRORS: Record<string, { error: string; message: string }> = {
  "entity.parse.failed": {
    error: "INVALID_JSON",
    message: "O corpo da requisição não é um JSON válido.",
  },
  "entity.too.large": {
    error: "PAYLOAD_TOO_LARGE",
    message: "O corpo da requisição excede o tamanho permitido.",
  },
  "encoding.unsupported": {
    error: "UNSUPPORTED_ENCODING",
    message: "Codificação do corpo não suportada.",
  },
  "charset.unsupported": {
    error: "UNSUPPORTED_CHARSET",
    message: "Charset do corpo não suportado.",
  },
};

function isBodyParserError(error: unknown): error is BodyParserError {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    typeof error.type === "string" &&
    "status" in error &&
    typeof error.status === "number" &&
    error.status >= 400 &&
    error.status < 500
  );
}

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  // O correlation ID no corpo permite localizar a request nos logs a partir do erro relatado.
  const correlationId = request.header(CORRELATION_HEADER);
  const send = (status: number, body: Record<string, unknown>) => {
    response.status(status).json({ ...body, correlationId });
  };

  if (error instanceof ZodError) {
    send(422, {
      error: "VALIDATION_ERROR",
      message: "Dados inválidos",
      details: error.flatten(),
    });
    return;
  }

  if (isBodyParserError(error)) {
    const known = BODY_ERRORS[error.type] ?? {
      error: "BAD_REQUEST",
      message: "Requisição inválida.",
    };
    send(error.status, known);
    return;
  }

  if (error instanceof AppError) {
    send(error.statusCode, { error: error.code, message: error.message });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2034") {
      send(409, {
        error: "CONCURRENT_OPERATION",
        message: "A operação conflitou com outra atualização. Tente novamente.",
      });
      return;
    }
    if (error.code === "P2003") {
      send(409, {
        error: "REFERENCE_CONFLICT",
        message: "Um dos registros relacionados não está disponível.",
      });
      return;
    }
    if (error.code === "P2025") {
      send(404, { error: "NOT_FOUND", message: "Registro não encontrado." });
      return;
    }
  }

  logger.error({ err: error }, "Erro não tratado na request");
  send(500, { error: "INTERNAL_ERROR", message: "Erro interno do servidor" });
};
