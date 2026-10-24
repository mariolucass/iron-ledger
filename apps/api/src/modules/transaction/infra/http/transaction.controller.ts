import { handle } from "../../../../infra/http/handle";
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

  list = handle(200, (request) => this.queries.list(listTransactionsSchema.parse(request.query)));

  start = handle(202, async (request, response) => {
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
  });

  get = handle(200, (request) => this.queries.get(transactionIdSchema.parse(request.params).id));

  /** Interno (worker): registra o progresso de um passo da Saga. */
  steps = handle(204, async (request) => {
    const { id } = transactionIdSchema.parse(request.params);
    await this.recordStep.execute({ ...recordStepSchema.parse(request.body), transactionId: id });
  });

  /** Interno (worker): finaliza a transação com o desfecho da Saga. */
  outcome = handle(200, (request) => {
    const { id } = transactionIdSchema.parse(request.params);
    const outcome = outcomeSchema.parse(request.body);
    return this.reportOutcome.execute({ transactionId: id, outcome }, request.auth!.userId);
  });
}
