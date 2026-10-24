import { NotFoundError } from "../../../shared/errors/not-found.error";
import type { WarehouseRepository } from "./warehouse";

export type WarehouseSection =
  "inventory" | "movements" | "reservations" | "transfers" | "counts" | "access" | "settings";

export interface WarehouseSectionsRepository {
  section(id: string, section: WarehouseSection, page: number, pageSize: number): Promise<unknown>;
  location(id: string, locationId: string): Promise<unknown>;
}

export class GetWarehouseSectionUseCase {
  constructor(
    private readonly warehouses: WarehouseRepository,
    private readonly sections: WarehouseSectionsRepository,
  ) {}
  async execute(id: string, section: WarehouseSection, page: number, pageSize: number) {
    if (!(await this.warehouses.findById(id))) throw new NotFoundError("Armazém não encontrado");
    return this.sections.section(id, section, page, pageSize);
  }
  async location(id: string, locationId: string) {
    if (!(await this.warehouses.findById(id))) throw new NotFoundError("Armazém não encontrado");
    const location = await this.sections.location(id, locationId);
    if (!location) throw new NotFoundError("Localização não encontrada");
    return location;
  }
}
