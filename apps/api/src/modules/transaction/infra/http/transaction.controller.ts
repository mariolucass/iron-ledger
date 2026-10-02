import { randomUUID } from "node:crypto";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../../identity/infra/guards/jwt.guard";
import { getTransactionSaga, startTransactionSaga } from "../temporal/transaction-saga.starter";

const startSchema = z.object({
  stockLevelId: z.string().uuid(),
  quantity: z.number().positive(),
  failConfirmation: z.boolean().default(false),
});
const paramsSchema = z.object({ id: z.string().uuid() });

export class TransactionController {
  start = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      const input = startSchema.parse(request.body);
      const result = await startTransactionSaga({ ...input, transactionId: randomUUID() });
      response.status(202).json(result);
    } catch (error) { next(error); }
  };

  get = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      const { id } = paramsSchema.parse(request.params);
      response.json(await getTransactionSaga(id));
    } catch (error) { next(error); }
  };
}
