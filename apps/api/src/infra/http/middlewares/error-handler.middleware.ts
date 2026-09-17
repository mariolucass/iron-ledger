import type { ErrorRequestHandler } from "express";
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

  console.error(error);
  response.status(500).json({ error: "INTERNAL_ERROR", message: "Erro interno do servidor" });
};
