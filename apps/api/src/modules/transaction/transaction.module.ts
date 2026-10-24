import type { ModuleFactory } from "../../infra/http/module";
import { QueryTransactionsUseCase } from "./application/use-cases/query-transactions.use-case";
import { RecordSagaStepUseCase } from "./application/use-cases/record-saga-step.use-case";
import { ReportTransactionOutcomeUseCase } from "./application/use-cases/report-transaction-outcome.use-case";
import { StartTransactionUseCase } from "./application/use-cases/start-transaction.use-case";
import { TransactionController } from "./infra/http/transaction.controller";
import { createTransactionRouter } from "./infra/http/transaction.routes";
import { PrismaStockAvailability } from "./infra/repositories/prisma-stock-availability";
import { PrismaTransactionRepository } from "./infra/repositories/prisma-transaction.repository";

export const transactionModule: ModuleFactory = ({
  env,
  prisma,
  logger,
  workflowOrchestrator,
  onEventsCommitted,
}) => {
  const repository = new PrismaTransactionRepository(prisma, { onEventsCommitted });
  const controller = new TransactionController(
    new StartTransactionUseCase(
      repository,
      repository,
      new PrismaStockAvailability(prisma),
      workflowOrchestrator,
      logger.child({ component: "transaction" }),
    ),
    new QueryTransactionsUseCase(repository),
    new RecordSagaStepUseCase(repository),
    new ReportTransactionOutcomeUseCase(repository, repository),
  );

  return [{ path: "/transactions", router: createTransactionRouter(controller, env.JWT_SECRET) }];
};
