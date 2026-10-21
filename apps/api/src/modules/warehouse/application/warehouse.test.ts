import { describe, expect, it } from "vitest";
import { createLocationSchema, createWarehouseSchema, updateWarehouseSchema } from "./warehouse";
import type { LocationNode, WarehouseDetail, WarehouseRepository } from "./warehouse";
import { CreateLocationUseCase, UpdateLocationUseCase, UpdateWarehouseUseCase } from "./warehouse.use-cases";

describe("schemas", () => {
  it("normaliza código, CNPJ e país", () => {
    const parsed = createWarehouseSchema.parse({
      code: " wh-centro ", name: "Centro", taxId: "12.345.678/0001-95", countryCode: "br",
    });
    expect(parsed).toMatchObject({ code: "WH-CENTRO", taxId: "12345678000195", countryCode: "BR" });
  });

  it.each([
    ["código com espaço", { code: "A B" }],
    ["CNPJ incompleto", { taxId: "123" }],
    ["fuso inválido", { timezone: "Nope/Zone" }],
    ["latitude sem longitude", { latitude: -23.5, longitude: null }],
    ["latitude fora da faixa", { latitude: 91, longitude: 0 }],
  ])("rejeita %s", (_label, patch) => {
    expect(createWarehouseSchema.safeParse({ code: "WH-1", name: "Centro", ...patch }).success).toBe(false);
  });

  it("não aceita alterar o código do armazém nem da localização", () => {
    expect(updateWarehouseSchema.parse({ code: "OUTRO", name: "Novo" })).toEqual({ name: "Novo" });
    expect(createLocationSchema.safeParse({ code: "a-01", type: "AISLE" }).data).toMatchObject({ code: "A-01" });
  });
});

const detail = (overrides: Partial<WarehouseDetail> = {}): WarehouseDetail => ({
  id: "w1", code: "WH", name: "W", type: "STORE", address: null, addressLine: null, city: null, state: null,
  postalCode: null, countryCode: "BR", latitude: null, longitude: null, timezone: "America/Sao_Paulo", taxId: null,
  isActive: true, version: 0, createdAt: "", updatedAt: "", locations: [], skuCount: 0, totalQuantity: 0, reserved: 0,
  ...overrides,
});

const location = (overrides: Partial<LocationNode> = {}): LocationNode => ({
  id: "l1", parentId: null, code: "A", name: null, type: "ZONE", path: "A", isPickable: true, isReceivable: true,
  isActive: true, maxWeightKg: null, maxVolumeM3: null, pickSequence: null, ...overrides,
});

function repository(opts: { warehouse?: WarehouseDetail | null; stock?: number; locationStock?: number; children?: number; locations?: LocationNode[] } = {}) {
  const calls: Record<string, unknown> = {};
  const repo: WarehouseRepository = {
    list: async () => ({ items: [], page: 1, pageSize: 100, total: 0 }),
    findById: async () => (opts.warehouse === undefined ? detail() : opts.warehouse),
    create: async () => detail(),
    update: async (_id, input) => { calls.update = input; return detail(); },
    stockOnHand: async () => opts.stock ?? 0,
    findLocation: async (_w, id) => (opts.locations ?? []).find((l) => l.id === id) ?? null,
    createLocation: async (_w, input) => { calls.createLocation = input; return location(); },
    updateLocation: async (_id, input) => { calls.updateLocation = input; return location(); },
    locationStockOnHand: async () => opts.locationStock ?? 0,
    activeChildCount: async () => opts.children ?? 0,
  };
  return { repo, calls };
}

describe("UpdateWarehouseUseCase", () => {
  it("bloqueia desativar armazém com estoque", async () => {
    const { repo } = repository({ stock: 10 });
    await expect(new UpdateWarehouseUseCase(repo).execute("w1", { isActive: false })).rejects.toMatchObject({
      statusCode: 409, code: "WAREHOUSE_HAS_STOCK",
    });
  });

  it("desativa quando não há estoque e responde 404 para id desconhecido", async () => {
    const ok = repository({ stock: 0 });
    await new UpdateWarehouseUseCase(ok.repo).execute("w1", { isActive: false });
    expect(ok.calls.update).toEqual({ isActive: false });
    await expect(new UpdateWarehouseUseCase(repository({ warehouse: null }).repo).execute("x", {})).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("CreateLocationUseCase", () => {
  it("monta o caminho materializado a partir do pai", async () => {
    const parent = location({ id: "p", path: "A/01" });
    const { repo, calls } = repository({ locations: [parent] });
    await new CreateLocationUseCase(repo).execute("w1", { code: "S1", type: "SHELF", parentId: "p" });
    expect(calls.createLocation).toMatchObject({ path: "A/01/S1" });
  });

  it("rejeita pai inexistente ou inativo", async () => {
    const missing = repository();
    await expect(new CreateLocationUseCase(missing.repo).execute("w1", { code: "S1", type: "SHELF", parentId: "nope" })).rejects.toMatchObject({ code: "PARENT_NOT_FOUND" });
    const inactive = repository({ locations: [location({ id: "p", isActive: false })] });
    await expect(new CreateLocationUseCase(inactive.repo).execute("w1", { code: "S1", type: "SHELF", parentId: "p" })).rejects.toMatchObject({ code: "PARENT_INACTIVE" });
  });
});

describe("UpdateLocationUseCase", () => {
  it("não desativa localização com estoque ou com filhas ativas", async () => {
    const withStock = repository({ locations: [location()], locationStock: 5 });
    await expect(new UpdateLocationUseCase(withStock.repo).execute("w1", "l1", { isActive: false })).rejects.toMatchObject({ code: "LOCATION_HAS_STOCK" });
    const withChildren = repository({ locations: [location()], children: 2 });
    await expect(new UpdateLocationUseCase(withChildren.repo).execute("w1", "l1", { isActive: false })).rejects.toMatchObject({ code: "LOCATION_HAS_CHILDREN" });
  });
});
