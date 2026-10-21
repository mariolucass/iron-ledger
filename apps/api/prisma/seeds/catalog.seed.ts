import { categories, products, units } from "./data/catalog.data";
import type { Seed } from "./types";

export const catalogSeed: Seed = {
  name: "catalog",
  async run({ prisma, log }) {
    const unitIds = new Map<string, string>();
    for (const unit of units) {
      const saved = await prisma.unitOfMeasure.upsert({
        where: { code: unit.code },
        update: { name: unit.name, type: unit.type, precision: unit.precision, isActive: true },
        create: unit,
      });
      unitIds.set(unit.code, saved.id);
    }

    const categoryIds = new Map<string, string>();
    for (const [index, category] of categories.entries()) {
      const fields = {
        name: category.name,
        slug: category.slug,
        path: `/${category.slug}`,
        sortOrder: index,
      };
      const saved = await prisma.category.upsert({
        where: { code: category.code },
        update: { ...fields, isActive: true, deletedAt: null },
        create: { code: category.code, ...fields },
      });
      categoryIds.set(category.code, saved.id);
    }

    for (const product of products) {
      const categoryId = categoryIds.get(product.category);
      if (!categoryId) throw new Error(`Categoria ${product.category} não encontrada.`);
      const categoryName = categories.find((category) => category.code === product.category)?.name;
      const fields = {
        name: product.name,
        unit: "un",
        baseUnitId: unitIds.get("un") ?? null,
        minStock: product.minStock,
        maxStock: product.maxStock,
        metadata: { category: categoryName },
      };

      const saved = await prisma.product.upsert({
        where: { sku: product.sku },
        update: { ...fields, isActive: true, deletedAt: null },
        create: { id: product.id, sku: product.sku, ...fields },
      });

      await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: saved.id, categoryId } },
        update: { isPrimary: true },
        create: { productId: saved.id, categoryId, isPrimary: true },
      });
    }

    log(`${units.length} unidades, ${categories.length} categorias, ${products.length} produtos`);
  },
};
