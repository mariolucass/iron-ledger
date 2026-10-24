import { Router } from "express";
import { env } from "../../config/env";
import { prisma } from "../database/prisma.client";
import { logger } from "../logger";
import { alertsModule } from "../../modules/alerts/alerts.module";
import { auditModule } from "../../modules/audit/audit.module";
import { catalogModule } from "../../modules/catalog/catalog.module";
import { identityModule } from "../../modules/identity/identity.module";
import { inventoryModule } from "../../modules/inventory/inventory.module";
import { platformModule } from "../../modules/platform/platform.module";
import { transactionModule } from "../../modules/transaction/transaction.module";
import { warehouseModule } from "../../modules/warehouse/warehouse.module";
import { createHealthRouter } from "./health.routes";
import type { ModuleContext, ModuleFactory, RouterDependencies } from "./module";
import { createTestEventRouter } from "./test-event.routes";

export type { RouterDependencies } from "./module";

/** Rotas montadas na ordem declarada; cada módulo compõe as próprias dependências. */
const MODULES: ModuleFactory[] = [
  identityModule,
  platformModule,
  catalogModule,
  inventoryModule,
  warehouseModule,
  auditModule,
  alertsModule,
  transactionModule,
];

export function createRouter(dependencies: RouterDependencies): Router {
  const context: ModuleContext = { ...dependencies, env, prisma, logger };
  const router = Router();

  router.use("/health", createHealthRouter(prisma));
  for (const { path, router: moduleRouter } of MODULES.flatMap((createModule) =>
    createModule(context),
  )) {
    router.use(path, moduleRouter);
  }
  router.use("/events", createTestEventRouter(context.eventBus, env.JWT_SECRET));

  return router;
}
