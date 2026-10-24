import { describe, expect, it } from "vitest";
import { createProductSchema, updateProductSchema } from "./product";
import {
  ArchiveProductUseCase,
  CreateProductUseCase,
  UpdateProductUseCase,
} from "./product.use-cases";
import type { ProductDetail, ProductRepository } from "./product";

const unitId = "8cf0bdf3-8d63-4d29-a820-7346144d75e8";
const categoryId = "0b6f8e0a-6f5e-4a39-9d76-3d3b7c2f8f11";

describe("createProductSchema", () => {
  it("normaliza SKU e NCM e aplica a moeda em maiúsculas", () => {
    const result = createProductSchema.parse({
      sku: " cam-001 ", name: "Camiseta", baseUnitId: unitId, ncm: "6109.10.00", currency: "brl",
    });
    expect(result).toMatchObject({ sku: "CAM-001", ncm: "61091000", currency: "BRL" });
  });

  it.each([
    ["SKU com espaço", { sku: "AB CD" }],
    ["NCM incompleto", { ncm: "1234" }],
    ["máximo menor que o mínimo", { minStock: 10, maxStock: 5 }],
    ["estoque negativo", { minStock: -1 }],
    ["dois códigos principais", { barcodes: [{ code: "1", isPrimary: true }, { code: "2", isPrimary: true }] }],
    ["códigos repetidos", { barcodes: [{ code: "1" }, { code: "1" }] }],
  ])("rejeita %s", (_label, patch) => {
    expect(createProductSchema.safeParse({ sku: "SKU-1", name: "Produto", baseUnitId: unitId, ...patch }).success).toBe(false);
  });
});

describe("updateProductSchema", () => {
  it("não aceita alterar o SKU", () => {
    expect(updateProductSchema.parse({ sku: "OUTRO", name: "Novo nome" })).toEqual({ name: "Novo nome" });
  });
});

function detail(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: "p1", sku: "SKU-1", name: "Produto", description: null, unit: "un", baseUnitId: unitId,
    status: "ACTIVE", isActive: true, trackingMode: "NONE", minStock: 5, maxStock: 20, reorderPoint: null,
    safetyStock: null, leadTimeDays: null, shelfLifeDays: null, weightKg: null, lengthCm: null, widthCm: null,
    heightCm: null, ncm: null, standardCost: null, salePrice: null, brand: null, currency: "BRL", categoryId: null, categoryName: null,
    barcodes: [], version: 0, createdAt: "", updatedAt: "", ...overrides,
  };
}

function repository(current: ProductDetail | null = detail()) {
  const calls: unknown[] = [];
  const repo: ProductRepository = {
    list: async () => ({ items: [], page: 1, pageSize: 20, total: 0 }),
    findById: async () => current,
    create: async (input) => { calls.push(input); return detail({ sku: input.sku }); },
    update: async (_id, input) => { calls.push(input); return detail(); },
    findUnit: async (id) => (id === unitId ? { id, code: "kg", name: "Quilograma", type: "WEIGHT", precision: 3 } : null),
    categoryExists: async (id) => id === categoryId,
    lookups: async () => ({ units: [], categories: [] }),
  };
  return { repo, calls };
}

describe("CreateProductUseCase", () => {
  it("deriva o código da unidade a partir da unidade escolhida", async () => {
    const { repo, calls } = repository();
    await new CreateProductUseCase(repo).execute({ sku: "SKU-1", name: "Produto", baseUnitId: unitId }, "actor");
    expect(calls[0]).toMatchObject({ unit: "kg", actorId: "actor" });
  });

  it("rejeita unidade e categoria inexistentes", async () => {
    const { repo } = repository();
    const useCase = new CreateProductUseCase(repo);
    await expect(
      useCase.execute({ sku: "SKU-1", name: "P", baseUnitId: "11111111-1111-4111-8111-111111111111" }, "a"),
    ).rejects.toMatchObject({ code: "UNIT_NOT_FOUND" });
    await expect(
      useCase.execute({ sku: "SKU-1", name: "P", baseUnitId: unitId, categoryId: "22222222-2222-4222-8222-222222222222" }, "a"),
    ).rejects.toMatchObject({ code: "CATEGORY_NOT_FOUND" });
  });
});

describe("UpdateProductUseCase", () => {
  it("valida a faixa de estoque contra o valor já salvo", async () => {
    const { repo } = repository(detail({ minStock: 5, maxStock: 20 }));
    await expect(new UpdateProductUseCase(repo).execute("p1", { minStock: 30 }, "a")).rejects.toMatchObject({
      code: "INVALID_STOCK_RANGE",
    });
  });

  it("retorna 404 para produto inexistente", async () => {
    const { repo } = repository(null);
    await expect(new UpdateProductUseCase(repo).execute("x", { name: "N" }, "a")).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("ArchiveProductUseCase", () => {
  it("arquiva em vez de apagar", async () => {
    const { repo, calls } = repository();
    await new ArchiveProductUseCase(repo).execute("p1", "actor");
    expect(calls[0]).toMatchObject({ status: "ARCHIVED" });
  });
});
