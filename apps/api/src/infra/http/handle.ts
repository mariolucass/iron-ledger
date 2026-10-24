import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../modules/identity/infra/guards/jwt.guard";

export type AsyncHandler = (
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
) => Promise<void>;

/**
 * Adapta um caso de uso a um handler Express: responde `status` com o JSON
 * retornado e encaminha qualquer erro ao `errorHandler`. Sem retorno, responde
 * sem corpo (ex.: 204); se `run` já respondeu, não faz nada.
 */
export function handle(
  status: number,
  run: (request: AuthenticatedRequest, response: Response) => Promise<unknown>,
): AsyncHandler {
  return async (request, response, next) => {
    try {
      const body = await run(request, response);
      if (response.headersSent) return;
      if (body === undefined) response.status(status).end();
      else response.status(status).json(body);
    } catch (error) {
      next(error);
    }
  };
}
