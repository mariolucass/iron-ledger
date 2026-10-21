import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../../identity/infra/guards/jwt.guard";
import {
  createLocationSchema,
  createWarehouseSchema,
  listWarehousesSchema,
  updateLocationSchema,
  updateWarehouseSchema,
} from "../../application/warehouse";
import type {
  CreateLocationUseCase,
  CreateWarehouseUseCase,
  DeactivateWarehouseUseCase,
  GetWarehouseUseCase,
  ListWarehousesUseCase,
  UpdateLocationUseCase,
  UpdateWarehouseUseCase,
} from "../../application/warehouse.use-cases";

const idSchema = z.object({ id: z.string().uuid() });
const locationParamsSchema = z.object({ id: z.string().uuid(), locationId: z.string().uuid() });

type Handler = (request: AuthenticatedRequest, response: Response, next: NextFunction) => Promise<void>;

export class WarehouseController {
  constructor(
    private readonly listWarehouses: ListWarehousesUseCase,
    private readonly getWarehouse: GetWarehouseUseCase,
    private readonly createWarehouse: CreateWarehouseUseCase,
    private readonly updateWarehouse: UpdateWarehouseUseCase,
    private readonly deactivateWarehouse: DeactivateWarehouseUseCase,
    private readonly createLocation: CreateLocationUseCase,
    private readonly updateLocation: UpdateLocationUseCase,
  ) {}

  private handle(status: number, run: (request: AuthenticatedRequest) => Promise<unknown>): Handler {
    return async (request, response, next) => {
      try {
        response.status(status).json(await run(request));
      } catch (error) {
        next(error);
      }
    };
  }

  list = this.handle(200, (request) => this.listWarehouses.execute(listWarehousesSchema.parse(request.query)));
  get = this.handle(200, (request) => this.getWarehouse.execute(idSchema.parse(request.params).id));
  create = this.handle(201, (request) => this.createWarehouse.execute(createWarehouseSchema.parse(request.body)));
  update = this.handle(200, (request) =>
    this.updateWarehouse.execute(idSchema.parse(request.params).id, updateWarehouseSchema.parse(request.body)),
  );
  deactivate = this.handle(200, (request) => this.deactivateWarehouse.execute(idSchema.parse(request.params).id));
  addLocation = this.handle(201, (request) =>
    this.createLocation.execute(idSchema.parse(request.params).id, createLocationSchema.parse(request.body)),
  );
  patchLocation = this.handle(200, (request) => {
    const { id, locationId } = locationParamsSchema.parse(request.params);
    return this.updateLocation.execute(id, locationId, updateLocationSchema.parse(request.body));
  });
}
