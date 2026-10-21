import { AppError } from "../../../shared/errors/domain.error";
import { NotFoundError } from "../../../shared/errors/not-found.error";
import type {
  CreateLocationInput,
  CreateWarehouseInput,
  ListWarehousesQuery,
  UpdateLocationInput,
  UpdateWarehouseInput,
  WarehouseRepository,
} from "./warehouse";

export class ListWarehousesUseCase {
  constructor(private readonly warehouses: WarehouseRepository) {}
  execute(query: ListWarehousesQuery) {
    return this.warehouses.list(query);
  }
}

export class GetWarehouseUseCase {
  constructor(private readonly warehouses: WarehouseRepository) {}
  async execute(id: string) {
    const warehouse = await this.warehouses.findById(id);
    if (!warehouse) throw new NotFoundError("Armazém não encontrado");
    return warehouse;
  }
}

export class CreateWarehouseUseCase {
  constructor(private readonly warehouses: WarehouseRepository) {}
  execute(input: CreateWarehouseInput) {
    return this.warehouses.create(input);
  }
}

export class UpdateWarehouseUseCase {
  constructor(private readonly warehouses: WarehouseRepository) {}

  async execute(id: string, input: UpdateWarehouseInput) {
    const current = await this.warehouses.findById(id);
    if (!current) throw new NotFoundError("Armazém não encontrado");

    // Um armazém com saldo não pode sair de operação: o estoque ficaria invisível.
    if (input.isActive === false && current.isActive && (await this.warehouses.stockOnHand(id)) > 0) {
      throw new AppError(
        "Não é possível desativar um armazém com estoque. Transfira ou baixe o saldo antes.",
        409,
        "WAREHOUSE_HAS_STOCK",
      );
    }
    return this.warehouses.update(id, input);
  }
}

export class DeactivateWarehouseUseCase {
  constructor(private readonly update: UpdateWarehouseUseCase) {}
  execute(id: string) {
    return this.update.execute(id, { isActive: false });
  }
}

export class CreateLocationUseCase {
  constructor(private readonly warehouses: WarehouseRepository) {}

  async execute(warehouseId: string, input: CreateLocationInput) {
    const warehouse = await this.warehouses.findById(warehouseId);
    if (!warehouse) throw new NotFoundError("Armazém não encontrado");
    if (!input.code) throw new AppError("Informe o código da localização", 422, "CODE_REQUIRED");
    if (!input.type) throw new AppError("Informe o tipo da localização", 422, "TYPE_REQUIRED");

    let path = input.code;
    if (input.parentId) {
      const parent = await this.warehouses.findLocation(warehouseId, input.parentId);
      if (!parent) throw new AppError("Localização pai não encontrada neste armazém", 422, "PARENT_NOT_FOUND");
      if (!parent.isActive) throw new AppError("A localização pai está inativa", 422, "PARENT_INACTIVE");
      path = `${parent.path}/${input.code}`;
    }
    return this.warehouses.createLocation(warehouseId, { ...input, path });
  }
}

export class UpdateLocationUseCase {
  constructor(private readonly warehouses: WarehouseRepository) {}

  async execute(warehouseId: string, locationId: string, input: UpdateLocationInput) {
    const current = await this.warehouses.findLocation(warehouseId, locationId);
    if (!current) throw new NotFoundError("Localização não encontrada");

    if (input.isActive === false && current.isActive) {
      if ((await this.warehouses.locationStockOnHand(locationId)) > 0) {
        throw new AppError("A localização possui estoque e não pode ser desativada", 409, "LOCATION_HAS_STOCK");
      }
      if ((await this.warehouses.activeChildCount(locationId)) > 0) {
        throw new AppError("Desative primeiro as localizações filhas", 409, "LOCATION_HAS_CHILDREN");
      }
    }
    return this.warehouses.updateLocation(locationId, input);
  }
}
