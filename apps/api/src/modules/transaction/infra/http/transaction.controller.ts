import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../../identity/infra/guards/jwt.guard";
import { CORRELATION_HEADER } from "../../../../infra/http/middlewares/request-logger.middleware";
import type { QueryTransactionsUseCase } from "../../application/use-cases/query-transactions.use-case";
import type { RecordSagaStepUseCase } from "../../application/use-cases/record-saga-step.use-case";
import type { ReportTransactionOutcomeUseCase } from "../../application/use-cases/report-transaction-outcome.use-case";
import type { StartTransactionUseCase } from "../../application/use-cases/start-transaction.use-case";
import {
  idempotencyKeySchema,
  listTransactionsSchema,
  outcomeSchema,
  recordStepSchema,
  startTransactionSchema,
  transactionIdSchema,
} from "./transaction.schemas";

export class TransactionController {
  constructor(
    private readonly startTransaction: StartTransactionUseCase,
    private readonly queries: QueryTransactionsUseCase,
    private readonly recordStep: RecordSagaStepUseCase,
    private readonly reportOutcome: ReportTransactionOutcomeUseCase,
  ) {}

  list = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      response.json(await this.queries.list(listTransactionsSchema.parse(request.query)));
    } catch (error) { next(error); }
  };

  start = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      const input = startTransactionSchema.parse(request.body);
      const result = await this.startTransaction.execute({
        ...input,
        actorId: request.auth!.userId,
        correlationId: request.header(CORRELATION_HEADER),
        idempotencyKey: idempotencyKeySchema.parse(request.header("idempotency-key")),
      });
      // 202: a Saga segue de forma assíncrona; 200: repetição idempotente.
      response
        .status(result.created ? 202 : 200)
        .location(`/transactions/${result.transaction.id}`)
        .json(result.transaction);
    } catch (error) { next(error); }
  };

  get = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      const { id } = transactionIdSchema.parse(request.params);
      response.json(await this.queries.get(id));
    } catch (error) { next(error); }
  };

  /** Interno (worker): registra o progresso de um passo da Saga. */
  steps = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      const { id } = transactionIdSchema.parse(request.params);
      await this.recordStep.execute({ ...recordStepSchema.parse(request.body), transactionId: id });
      response.status(204).end();
    } catch (error) { next(error); }
  };

  /** Interno (worker): finaliza a transação com o desfecho da Saga. */
  outcome = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      const { id } = transactionIdSchema.parse(request.params);
      const outcome = outcomeSchema.parse(request.body);
      response.json(await this.reportOutcome.execute({ transactionId: id, outcome }, request.auth!.userId));
    } catch (error) { next(error); }
  };
}
