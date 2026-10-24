import type { ModuleFactory } from "../../infra/http/module";
import {
  ListAlertsUseCase,
  ResolveAllAlertsUseCase,
  UpdateAlertStatusUseCase,
} from "./application/use-cases/alert.use-cases";
import { AlertsController } from "./infra/http/alerts.controller";
import { createAlertsRouter } from "./infra/http/alerts.routes";
import { PrismaAlertRepository } from "./infra/repositories/prisma-alert.repository";

export const alertsModule: ModuleFactory = ({ env, prisma }) => {
  const repository = new PrismaAlertRepository(prisma);
  const controller = new AlertsController(
    new ListAlertsUseCase(repository),
    new UpdateAlertStatusUseCase(repository),
    new ResolveAllAlertsUseCase(repository),
  );

  return [{ path: "/alerts", router: createAlertsRouter(controller, env.JWT_SECRET) }];
};
