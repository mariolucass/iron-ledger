import { z } from "zod";
import { handle } from "../../../../infra/http/handle";
import {
  createLocationSchema,
  createWarehouseSchema,
  listWarehousesSchema,
  updateLocationSchema,
  updateWarehouseSchema,
} from "../../application/warehouse";
import type { GetWarehouseSectionUseCase } from "../../application/warehouse-sections";
import type {
  CreateLocationUseCase,
  CreateWarehouseUseCase,
  DeactivateWarehouseUseCase,
  GetWarehouseUseCase,
  ListWarehousesUseCase,
  UpdateLocationUseCase,
  UpdateWarehouseUseCase,
} from "../../application/warehouse.use-cases";
import { pageQuerySchema } from "../../../../shared/utils/pagination";

const idSchema = z.object({ id: z.string().uuid() });
const locationParamsSchema = z.object({ id: z.string().uuid(), locationId: z.string().uuid() });

export class WarehouseController {
  constructor(
    private readonly listWarehouses: ListWarehousesUseCase,
    private readonly getWarehouse: GetWarehouseUseCase,
    private readonly createWarehouse: CreateWarehouseUseCase,
    private readonly updateWarehouse: UpdateWarehouseUseCase,
    private readonly deactivateWarehouse: DeactivateWarehouseUseCase,
    private readonly createLocation: CreateLocationUseCase,
    private readonly updateLocation: UpdateLocationUseCase,
    private readonly getSection: GetWarehouseSectionUseCase,
  ) {}

  list = handle(200, (request) =>
    this.listWarehouses.execute(listWarehousesSchema.parse(request.query)),
  );
  get = handle(200, (request) => this.getWarehouse.execute(idSchema.parse(request.params).id));
  section = handle(200, (request) => {
    const params = idSchema
      .extend({
        section: z.enum([
          "inventory",
          "movements",
          "reservations",
          "transfers",
          "counts",
          "access",
          "settings",
        ]),
      })
      .parse(request.params);
    const query = pageQuerySchema.parse(request.query);
    return this.getSection.execute(params.id, params.section, query.page, query.pageSize);
  });
  access = handle(200, (request) => {
    const { id } = idSchema.parse(request.params);
    return this.getSection.execute(id, "access", 1, 100);
  });
  location = handle(200, (request) => {
    const { id, locationId } = locationParamsSchema.parse(request.params);
    return this.getSection.location(id, locationId);
  });
  create = handle(201, (request) =>
    this.createWarehouse.execute(createWarehouseSchema.parse(request.body)),
  );
  update = handle(200, (request) =>
    this.updateWarehouse.execute(
      idSchema.parse(request.params).id,
      updateWarehouseSchema.parse(request.body),
    ),
  );
  deactivate = handle(200, (request) =>
    this.deactivateWarehouse.execute(idSchema.parse(request.params).id),
  );
  addLocation = handle(201, (request) =>
    this.createLocation.execute(
      idSchema.parse(request.params).id,
      createLocationSchema.parse(request.body),
    ),
  );
  patchLocation = handle(200, (request) => {
    const { id, locationId } = locationParamsSchema.parse(request.params);
    return this.updateLocation.execute(id, locationId, updateLocationSchema.parse(request.body));
  });
}
