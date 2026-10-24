import type { CreateUnitInput, ListUnitsQuery, UnitRepository } from "./unit-of-measure";
export class ListUnitsUseCase {
  constructor(private readonly units: UnitRepository) {}
  execute(query: ListUnitsQuery) { return this.units.list(query); }
}
export class CreateUnitUseCase {
  constructor(private readonly units: UnitRepository) {}
  execute(input: CreateUnitInput) { return this.units.create(input); }
}
