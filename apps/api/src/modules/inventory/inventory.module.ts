import type { ModuleFactory } from "../../infra/http/module";
import { CommitReservationUseCase } from "./application/use-cases/commit-reservation.use-case";
import { QueryInventoryUseCase } from "./application/use-cases/query-inventory.use-case";
import { ReleaseStockUseCase } from "./application/use-cases/release-stock.use-case";
import { ReserveStockUseCase } from "./application/use-cases/reserve-stock.use-case";
import { UpdateStockUseCase } from "./application/use-cases/update-stock.use-case";
import { InventoryController } from "./infra/http/inventory.controller";
import { createInventoryRouter } from "./infra/http/inventory.routes";
import { PrismaInventoryRepository } from "./infra/repositories/prisma-inventory.repository";

export const inventoryModule: ModuleFactory = ({ env, prisma, onEventsCommitted }) => {
  const repository = new PrismaInventoryRepository(prisma, { onEventsCommitted });
  const controller = new InventoryController(
    new QueryInventoryUseCase(repository),
    new UpdateStockUseCase(repository),
    new ReserveStockUseCase(repository),
    new ReleaseStockUseCase(repository),
    new CommitReservationUseCase(repository),
  );

  return [{ path: "/inventory", router: createInventoryRouter(controller, env.JWT_SECRET) }];
};
