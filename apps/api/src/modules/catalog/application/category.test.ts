import { describe, expect, it } from "vitest";
import { createCategorySchema } from "./category";
import { CreateCategoryUseCase } from "./category.use-cases";
import type { CategoryItem, CategoryRepository } from "./category";

const parent: CategoryItem = {
  id: "0b6f8e0a-6f5e-4a39-9d76-3d3b7c2f8f11", parentId: null,
  code: "ROUPAS", name: "Roupas", slug: "roupas", path: "/roupas", depth: 0,
  description: null, sortOrder: 0, isActive: true, createdAt: "", updatedAt: "",
};

describe("CreateCategoryUseCase", () => {
  it("normaliza o código e deriva o caminho da categoria pai", async () => {
    let created: Parameters<CategoryRepository["create"]>[0] | undefined;
    const repository: CategoryRepository = {
      list: async () => ({ items: [], total: 0, page: 1, pageSize: 20 }),
      findById: async () => parent,
      create: async (input) => { created = input; return { ...parent, ...input, id: "new", createdAt: "", updatedAt: "" }; },
    };
    const input = createCategorySchema.parse({ code: " cam-1 ", name: " Camisetas Básicas ", parentId: parent.id });
    await new CreateCategoryUseCase(repository).execute(input);
    expect(created).toMatchObject({ code: "CAM-1", slug: "camisetas-basicas", path: "/roupas/camisetas-basicas", depth: 1 });
  });
  it("rejeita pai inexistente", async () => {
    const repository: CategoryRepository = {
      list: async () => ({ items: [], total: 0, page: 1, pageSize: 20 }),
      findById: async () => null,
      create: async () => { throw new Error("unexpected create"); },
    };
    await expect(new CreateCategoryUseCase(repository).execute(createCategorySchema.parse({ code: "ABC", name: "Teste", parentId: parent.id }))).rejects.toThrow("Categoria pai não encontrada");
  });
});
