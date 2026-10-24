import { Prisma } from "@prisma/client";
import { prisma } from "../../../../infra/database/prisma.client";
import { AppError } from "../../../../shared/errors/domain.error";
import type { CategoryItem, CategoryRepository, CreateCategoryInput, ListCategoriesQuery } from "../../application/category";

const mapCategory = (item: { id: string; parentId: string | null; code: string; name: string; slug: string; path: string; depth: number; description: string | null; sortOrder: number; isActive: boolean; createdAt: Date; updatedAt: Date }): CategoryItem => ({
  ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString(),
});
export class PrismaCategoryRepository implements CategoryRepository {
  async list(query: ListCategoriesQuery) {
    const where: Prisma.CategoryWhereInput = {
      deletedAt: null,
      ...(query.q ? { OR: [{ name: { contains: query.q, mode: "insensitive" } }, { code: { contains: query.q, mode: "insensitive" } }] } : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.category.findMany({ where, orderBy: [{ path: "asc" }, { sortOrder: "asc" }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
      prisma.category.count({ where }),
    ]);
    return { items: items.map(mapCategory), total, page: query.page, pageSize: query.pageSize };
  }
  async findById(id: string) {
    const item = await prisma.category.findFirst({ where: { id, deletedAt: null } });
    return item ? mapCategory(item) : null;
  }
  async create(input: CreateCategoryInput & { slug: string; path: string; depth: number }) {
    try {
      const item = await prisma.category.create({ data: {
        code: input.code, name: input.name, description: input.description ?? null,
        parentId: input.parentId ?? null, sortOrder: input.sortOrder, isActive: input.isActive,
        slug: input.slug, path: input.path, depth: input.depth,
      } });
      return mapCategory(item);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("Código ou nome já utilizado neste nível da árvore", 409, "CATEGORY_ALREADY_EXISTS");
      }
      throw error;
    }
  }
}
