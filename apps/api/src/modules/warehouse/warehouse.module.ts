import type { ModuleFactory } from "../../infra/http/module";
import { GetWarehouseSectionUseCase } from "./application/warehouse-sections";
import {
  CreateLocationUseCase,
  CreateWarehouseUseCase,
  DeactivateWarehouseUseCase,
  GetWarehouseUseCase,
  ListWarehousesUseCase,
  UpdateLocationUseCase,
  UpdateWarehouseUseCase,
} from "./application/warehouse.use-cases";
import { WarehouseController } from "./infra/http/warehouse.controller";
import { createWarehouseRouter } from "./infra/http/warehouse.routes";
import { PrismaWarehouseRepository } from "./infra/repositories/prisma-warehouse.repository";
import { PrismaWarehouseSectionsRepository } from "./infra/repositories/prisma-warehouse-sections.repository";

export const warehouseModule: ModuleFactory = ({ env }) => {
  const repository = new PrismaWarehouseRepository();
  const updateWarehouse = new UpdateWarehouseUseCase(repository);
  const controller = new WarehouseController(
    new ListWarehousesUseCase(repository),
    new GetWarehouseUseCase(repository),
    new CreateWarehouseUseCase(repository),
    updateWarehouse,
    new DeactivateWarehouseUseCase(updateWarehouse),
    new CreateLocationUseCase(repository),
    new UpdateLocationUseCase(repository),
    new GetWarehouseSectionUseCase(repository, new PrismaWarehouseSectionsRepository()),
  );

  return [{ path: "/warehouses", router: createWarehouseRouter(controller, env.JWT_SECRET) }];
};
