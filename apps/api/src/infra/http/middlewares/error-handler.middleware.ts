import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../../../shared/errors/domain.error";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(422).json({
      error: "VALIDATION_ERROR",
      message: "Dados inválidos",
      details: error.flatten(),
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({ error: error.code, message: error.message });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2034") {
      response
        .status(409)
        .json({
          error: "CONCURRENT_OPERATION",
          message: "A operação conflitou com outra atualização. Tente novamente.",
        });
      return;
    }
    if (error.code === "P2003") {
      response
        .status(409)
        .json({
          error: "REFERENCE_CONFLICT",
          message: "Um dos registros relacionados não está disponível.",
        });
      return;
    }
    if (error.code === "P2025") {
      response.status(404).json({ error: "NOT_FOUND", message: "Registro não encontrado." });
      return;
    }
  }

  console.error(error);
  response.status(500).json({ error: "INTERNAL_ERROR", message: "Erro interno do servidor" });
};
