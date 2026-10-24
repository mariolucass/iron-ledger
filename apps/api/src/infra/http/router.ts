import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env";
import { prisma } from "../database/prisma.client";
import { logger } from "../logger";
import { EVENT_PRODUCER, type EventBus } from "../messaging/rabbitmq.client";
import { LoginUseCase } from "../../modules/identity/application/use-cases/login.use-case";
import { jwtGuard, type AuthenticatedRequest } from "../../modules/identity/infra/guards/jwt.guard";
import { AuthController } from "../../modules/identity/infra/http/auth.controller";
import { createAuthRouter } from "../../modules/identity/infra/http/auth.routes";
import { RegisterUserUseCase } from "../../modules/identity/application/use-cases/register-user.use-case";
import { PrismaRegisterUserRepository } from "../../modules/identity/infra/repositories/prisma-register-user.repository";
import {
  ArchiveProductUseCase,
  CreateProductUseCase,
  GetProductLookupsUseCase,
  GetProductUseCase,
  ListProductsUseCase,
  UpdateProductUseCase,
} from "../../modules/catalog/application/product.use-cases";
import { ProductController } from "../../modules/catalog/infra/http/product.controller";
import { GetProductSectionUseCase } from "../../modules/catalog/application/product-sections";
import { createProductRouter } from "../../modules/catalog/infra/http/product.routes";
import { ProductImportController } from "../../modules/catalog/infra/http/product-import.controller";
import {
  CommitProductImportUseCase,
  PreviewProductImportUseCase,
} from "../../modules/catalog/application/product-import.use-cases";
import { PrismaProductRepository } from "../../modules/catalog/infra/repositories/prisma-product.repository";
import {
  CreateCategoryUseCase,
  ListCategoriesUseCase,
} from "../../modules/catalog/application/category.use-cases";
import { PrismaCategoryRepository } from "../../modules/catalog/infra/repositories/prisma-category.repository";
import { createCategoryRouter } from "../../modules/catalog/infra/http/category.routes";
import {
  CreateUnitUseCase,
  ListUnitsUseCase,
} from "../../modules/catalog/application/unit-of-measure.use-cases";
import { PrismaUnitRepository } from "../../modules/catalog/infra/repositories/prisma-unit.repository";
import { createUnitRouter } from "../../modules/catalog/infra/http/unit.routes";
import {
  CreateLocationUseCase,
  CreateWarehouseUseCase,
  DeactivateWarehouseUseCase,
  GetWarehouseUseCase,
  ListWarehousesUseCase,
  UpdateLocationUseCase,
  UpdateWarehouseUseCase,
} from "../../modules/warehouse/application/warehouse.use-cases";
import { WarehouseController } from "../../modules/warehouse/infra/http/warehouse.controller";
import { createWarehouseRouter } from "../../modules/warehouse/infra/http/warehouse.routes";
import { PrismaWarehouseRepository } from "../../modules/warehouse/infra/repositories/prisma-warehouse.repository";
import { PrismaWarehouseSectionsRepository } from "../../modules/warehouse/infra/repositories/prisma-warehouse-sections.repository";
import { GetWarehouseSectionUseCase } from "../../modules/warehouse/application/warehouse-sections";
import {
  CreateUserUseCase,
  GetUserUseCase,
  ListRolesUseCase,
  ListUsersUseCase,
  SetUserRolesUseCase,
  UpdateUserUseCase,
} from "../../modules/identity/application/use-cases/user-admin.use-cases";
import { UserAdminController } from "../../modules/identity/infra/http/user-admin.controller";
import {
  createRolesRouter,
  createUserAdminRouter,
} from "../../modules/identity/infra/http/user-admin.routes";
import { PrismaUserAdminRepository } from "../../modules/identity/infra/repositories/prisma-user-admin.repository";
import { createAccountSecurityRouter } from "../../modules/identity/infra/http/account-security.routes";
import { PrismaPlatformRepository } from "../../modules/platform/infra/repositories/prisma-platform.repository";
import { PlatformUseCase } from "../../modules/platform/application/platform";
import { PlatformServicesProbe } from "../../modules/platform/infra/services/platform-services.probe";
import { createPlatformRouter } from "../../modules/platform/infra/http/platform.routes";
import { PrismaIdentityDirectoryRepository } from "../../modules/identity/infra/repositories/prisma-identity-directory.repository";
import { IdentityDirectoryUseCase } from "../../modules/identity/application/identity-directory";
import { ChangePasswordUseCase } from "../../modules/identity/application/use-cases/change-password.use-case";
import { GetProfileUseCase } from "../../modules/identity/application/use-cases/get-profile.use-case";
import { UpdatePreferencesUseCase } from "../../modules/identity/application/use-cases/update-preferences.use-case";
import { UpdateProfileUseCase } from "../../modules/identity/application/use-cases/update-profile.use-case";
import { ProfileController } from "../../modules/identity/infra/http/profile.controller";
import { createProfileRouter } from "../../modules/identity/infra/http/profile.routes";
import { PrismaProfileRepository } from "../../modules/identity/infra/repositories/prisma-profile.repository";
import { PrismaLoginUserRepository } from "../../modules/identity/infra/repositories/prisma-login-user.repository";
import { UpdateStockUseCase } from "../../modules/inventory/application/use-cases/update-stock.use-case";
import { ReserveStockUseCase } from "../../modules/inventory/application/use-cases/reserve-stock.use-case";
import { ReleaseStockUseCase } from "../../modules/inventory/application/use-cases/release-stock.use-case";
import { CommitReservationUseCase } from "../../modules/inventory/application/use-cases/commit-reservation.use-case";
import { InventoryController } from "../../modules/inventory/infra/http/inventory.controller";
import { createInventoryRouter } from "../../modules/inventory/infra/http/inventory.routes";
import { PrismaInventoryRepository } from "../../modules/inventory/infra/repositories/prisma-inventory.repository";
import { QueryAuditUseCase } from "../../modules/audit/application/use-cases/query-audit.use-case";
import { AuditController } from "../../modules/audit/infra/http/audit.controller";
import { createAuditRouter } from "../../modules/audit/infra/http/audit.routes";
import { PrismaAuditRepository } from "../../modules/audit/infra/repositories/prisma-audit.repository";
import type { WorkflowOrchestrator } from "../../modules/transaction/application/ports/workflow-orchestrator.port";
import { QueryTransactionsUseCase } from "../../modules/transaction/application/use-cases/query-transactions.use-case";
import { RecordSagaStepUseCase } from "../../modules/transaction/application/use-cases/record-saga-step.use-case";
import { ReportTransactionOutcomeUseCase } from "../../modules/transaction/application/use-cases/report-transaction-outcome.use-case";
import { StartTransactionUseCase } from "../../modules/transaction/application/use-cases/start-transaction.use-case";
import { TransactionController } from "../../modules/transaction/infra/http/transaction.controller";
import { createTransactionRouter } from "../../modules/transaction/infra/http/transaction.routes";
import { PrismaStockAvailability } from "../../modules/transaction/infra/repositories/prisma-stock-availability";
import { PrismaTransactionRepository } from "../../modules/transaction/infra/repositories/prisma-transaction.repository";
import { AlertsController } from "../../modules/alerts/infra/http/alerts.controller";
import { createAlertsRouter } from "../../modules/alerts/infra/http/alerts.routes";
import { PrismaAlertRepository } from "../../modules/alerts/infra/repositories/prisma-alert.repository";

export interface RouterDependencies {
  eventBus: EventBus;
  workflowOrchestrator: WorkflowOrchestrator;
  /** Acorda o relay do outbox após commits com eventos. */
  onEventsCommitted?: () => void;
  /** Saúde do Temporal para o painel de serviços; ausente, o Temporal aparece desativado. */
  temporalHealth?: () => Promise<{ pollers: number }>;
}

const eventSchema = z.object({
  eventName: z
    .string()
    .min(3)
    .regex(/^[A-Za-z][A-Za-z0-9.]*$/),
  aggregateId: z.string().optional(),
  payload: z.record(z.unknown()).default({}),
});

export function createRouter({
  eventBus,
  workflowOrchestrator,
  onEventsCommitted,
  temporalHealth,
}: RouterDependencies): Router {
  const router = Router();
  const login = new LoginUseCase(
    new PrismaLoginUserRepository(),
    env.JWT_SECRET,
    env.JWT_EXPIRES_IN as never,
  );
  const registerUser = new RegisterUserUseCase(
    new PrismaRegisterUserRepository(),
    env.JWT_SECRET,
    env.JWT_EXPIRES_IN as never,
  );
  const profileRepository = new PrismaProfileRepository();
  const profileController = new ProfileController(
    new GetProfileUseCase(profileRepository),
    new UpdateProfileUseCase(profileRepository),
    new UpdatePreferencesUseCase(profileRepository),
    new ChangePasswordUseCase(profileRepository),
  );
  const userAdminRepository = new PrismaUserAdminRepository();
  const identityDirectory = new IdentityDirectoryUseCase(new PrismaIdentityDirectoryRepository());
  const userAdminController = new UserAdminController(
    new ListUsersUseCase(userAdminRepository),
    new GetUserUseCase(userAdminRepository),
    new ListRolesUseCase(userAdminRepository),
    new CreateUserUseCase(userAdminRepository),
    new UpdateUserUseCase(userAdminRepository),
    new SetUserRolesUseCase(userAdminRepository),
    identityDirectory,
  );
  const productRepository = new PrismaProductRepository();
  const productController = new ProductController(
    new ListProductsUseCase(productRepository),
    new GetProductUseCase(productRepository),
    new GetProductLookupsUseCase(productRepository),
    new CreateProductUseCase(productRepository),
    new UpdateProductUseCase(productRepository),
    new ArchiveProductUseCase(productRepository),
    new GetProductSectionUseCase(productRepository, productRepository),
  );
  const warehouseRepository = new PrismaWarehouseRepository();
  const updateWarehouse = new UpdateWarehouseUseCase(warehouseRepository);
  const warehouseController = new WarehouseController(
    new ListWarehousesUseCase(warehouseRepository),
    new GetWarehouseUseCase(warehouseRepository),
    new CreateWarehouseUseCase(warehouseRepository),
    updateWarehouse,
    new DeactivateWarehouseUseCase(updateWarehouse),
    new CreateLocationUseCase(warehouseRepository),
    new UpdateLocationUseCase(warehouseRepository),
    new GetWarehouseSectionUseCase(warehouseRepository, new PrismaWarehouseSectionsRepository()),
  );
  const inventoryRepository = new PrismaInventoryRepository();
  const inventoryController = new InventoryController(
    inventoryRepository,
    new UpdateStockUseCase(inventoryRepository, eventBus),
    new ReserveStockUseCase(inventoryRepository, eventBus),
    new ReleaseStockUseCase(inventoryRepository, eventBus),
    new CommitReservationUseCase(inventoryRepository, eventBus),
  );
  const auditController = new AuditController(new QueryAuditUseCase(new PrismaAuditRepository()));
  const transactionRepository = new PrismaTransactionRepository(prisma, { onEventsCommitted });
  const transactionController = new TransactionController(
    new StartTransactionUseCase(
      transactionRepository,
      transactionRepository,
      new PrismaStockAvailability(prisma),
      workflowOrchestrator,
      logger.child({ component: "transaction" }),
    ),
    new QueryTransactionsUseCase(transactionRepository),
    new RecordSagaStepUseCase(transactionRepository),
    new ReportTransactionOutcomeUseCase(transactionRepository, transactionRepository),
  );

  router.get("/health", (_request, response) => {
    response.json({
      status: "ok",
      service: "iron-ledger-api",
      timestamp: new Date().toISOString(),
    });
  });
  router.use("/auth", createAuthRouter(new AuthController(login, registerUser)));
  router.use("/me", createProfileRouter(profileController, env.JWT_SECRET));
  router.use("/me/security", createAccountSecurityRouter(identityDirectory, env.JWT_SECRET));
  router.use("/users", createUserAdminRouter(userAdminController, env.JWT_SECRET));
  router.use("/roles", createRolesRouter(userAdminController, env.JWT_SECRET));
  const servicesProbe = new PlatformServicesProbe(eventBus, {
    eventBusDriver: env.EVENT_BUS,
    rabbitMqUrl: env.RABBITMQ_URL,
    outboxRelayEnabled: env.OUTBOX_RELAY_ENABLED,
    outboxPollIntervalMs: env.OUTBOX_POLL_INTERVAL_MS,
    temporal: {
      address: env.TEMPORAL_ADDRESS,
      namespace: env.TEMPORAL_NAMESPACE,
      taskQueue: env.TEMPORAL_TASK_QUEUE,
    },
    temporalHealth,
    kafkaBrokers: (env.KAFKA_BROKERS ?? `localhost:${env.KAFKA_PORT}`).split(",").filter(Boolean),
    analyticsUrl: env.ANALYTICS_URL ?? `http://localhost:${env.ANALYTICS_PORT}`,
  });
  router.use(
    "/platform",
    createPlatformRouter(
      new PlatformUseCase(new PrismaPlatformRepository(), servicesProbe),
      env.JWT_SECRET,
    ),
  );
  const productImportController = new ProductImportController(
    new PreviewProductImportUseCase(productRepository),
    new CommitProductImportUseCase(productRepository),
  );
  router.use(
    "/products",
    createProductRouter(productController, productImportController, env.JWT_SECRET),
  );
  const categoryRepository = new PrismaCategoryRepository();
  router.use(
    "/categories",
    createCategoryRouter(
      new ListCategoriesUseCase(categoryRepository),
      new CreateCategoryUseCase(categoryRepository),
      env.JWT_SECRET,
    ),
  );
  const unitRepository = new PrismaUnitRepository();
  router.use(
    "/units-of-measure",
    createUnitRouter(
      new ListUnitsUseCase(unitRepository),
      new CreateUnitUseCase(unitRepository),
      env.JWT_SECRET,
    ),
  );
  router.use("/inventory", createInventoryRouter(inventoryController, env.JWT_SECRET));
  router.use("/warehouses", createWarehouseRouter(warehouseController, env.JWT_SECRET));
  router.use("/audit", createAuditRouter(auditController, env.JWT_SECRET));
  router.use("/alerts", createAlertsRouter(new AlertsController(new PrismaAlertRepository(prisma)), env.JWT_SECRET));
  router.use("/transactions", createTransactionRouter(transactionController, env.JWT_SECRET));

  router.post(
    "/events/test",
    jwtGuard(env.JWT_SECRET),
    async (request: AuthenticatedRequest, response, next) => {
      try {
        const input = eventSchema.parse(request.body);
        const event = {
          eventId: randomUUID(),
          eventName: input.eventName,
          eventVersion: 1,
          occurredAt: new Date().toISOString(),
          producer: EVENT_PRODUCER,
          aggregateId: input.aggregateId,
          correlationId: request.header("x-correlation-id"),
          actorId: request.auth?.userId,
          payload: input.payload,
        };
        await eventBus.publish(event);
        response.status(202).json({ published: true, exchange: eventBus.exchange, event });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
