import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { AppError } from "../../../../shared/errors/domain.error";
import { prisma } from "../../../../infra/database/prisma.client";
import { pagination } from "../../../../shared/utils/pagination";
import type {
  CategoryOption,
  CreateProductInput,
  ListProductsQuery,
  Page,
  ProductDetail,
  ProductListItem,
  ProductRepository,
  UnitOption,
  UpdateProductInput,
} from "../../application/product";
import type { ProductImportPlan, ProductImportRepository } from "../../application/product-import";
import type { ProductSectionsRepository } from "../../application/product-sections";

const detailInclude = {
  barcodes: { orderBy: { createdAt: "asc" } },
  categories: { where: { isPrimary: true }, include: { category: true }, take: 1 },
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof detailInclude }>;

const num = (value: Prisma.Decimal | null): number | null => (value === null ? null : value.toNumber());

function toDetail(product: ProductWithRelations): ProductDetail {
  const primary = product.categories[0];
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    unit: product.unit,
    baseUnitId: product.baseUnitId,
    status: product.status,
    isActive: product.isActive,
    trackingMode: product.trackingMode,
    minStock: product.minStock.toNumber(),
    maxStock: num(product.maxStock),
    reorderPoint: num(product.reorderPoint),
    safetyStock: num(product.safetyStock),
    leadTimeDays: product.leadTimeDays,
    shelfLifeDays: product.shelfLifeDays,
    weightKg: num(product.weightKg),
    lengthCm: num(product.lengthCm),
    widthCm: num(product.widthCm),
    heightCm: num(product.heightCm),
    ncm: product.ncm,
    standardCost: num(product.standardCost),
    salePrice: num(product.salePrice),
    brand: product.brand,
    currency: product.currency,
    categoryId: primary?.categoryId ?? null,
    categoryName: primary?.category.name ?? null,
    barcodes: product.barcodes.map((barcode) => ({
      id: barcode.id,
      code: barcode.code,
      type: barcode.type,
      quantity: barcode.quantity.toNumber(),
      isPrimary: barcode.isPrimary,
    })),
    images: typeof product.metadata === "object" && product.metadata !== null && !Array.isArray(product.metadata) &&
      Array.isArray(product.metadata.images)
      ? product.metadata.images.filter((url): url is string => typeof url === "string" && url.startsWith("https://"))
      : [],
    version: product.version,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

function translateConflict(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = String(error.meta?.target ?? "");
    if (target.includes("sku")) throw new AppError("Já existe um produto com este SKU", 409, "SKU_ALREADY_EXISTS");
    if (target.includes("code")) throw new AppError("Um dos códigos de barras já está em uso", 409, "BARCODE_ALREADY_EXISTS");
  }
  throw error;
}

type BarcodeInput = NonNullable<CreateProductInput["barcodes"]>[number];

const barcodeRows = (barcodes: BarcodeInput[]) =>
  barcodes.map((barcode) => ({ code: barcode.code, type: barcode.type, quantity: barcode.quantity, isPrimary: barcode.isPrimary }));

/** Campos escalares comuns à criação e à atualização (ausente = não mexe). */
function scalarFields(input: UpdateProductInput & { unit?: string }) {
  const { categoryId: _category, barcodes: _barcodes, images: _images, status, ...rest } = input;
  return {
    ...rest,
    ...(status ? { status, isActive: status === "ACTIVE" } : {}),
  };
}

const IMPORT_CHUNK = 1_000;

const chunks = <T>(items: T[]) =>
  Array.from({ length: Math.ceil(items.length / IMPORT_CHUNK) }, (_, index) => items.slice(index * IMPORT_CHUNK, (index + 1) * IMPORT_CHUNK));

/** Código derivado do path (`/vestuario/camisetas` → `VESTUARIO-CAMISETAS`), com sufixo se já usado. */
function categoryCode(path: string, taken: Set<string>) {
  const base = path.slice(1).replace(/\//g, "-").toUpperCase().slice(0, 58);
  let code = base;
  for (let suffix = 2; taken.has(code); suffix += 1) code = `${base}-${suffix}`;
  taken.add(code);
  return code;
}

export class PrismaProductRepository implements ProductRepository, ProductSectionsRepository, ProductImportRepository {
  async inventory(id: string) {
    const rows = await prisma.stockLevel.findMany({
      where: { productId: id },
      include: { warehouse: { select: { code: true, name: true } } },
      orderBy: { warehouse: { name: "asc" } },
    });
    return rows.map((row) => ({
      id: row.id, warehouseId: row.warehouseId, warehouseCode: row.warehouse.code,
      warehouseName: row.warehouse.name, quantity: row.quantity.toNumber(),
      reserved: row.reserved.toNumber(), available: row.quantity.minus(row.reserved).toNumber(),
      incoming: row.incoming.toNumber(), updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async movements(id: string, page: number, pageSize: number) {
    const where = { productId: id };
    const [rows, total] = await prisma.$transaction([
      prisma.stockMovement.findMany({
        where, orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize, take: pageSize,
        include: { warehouse: { select: { name: true } } },
      }),
      prisma.stockMovement.count({ where }),
    ]);
    return { page, pageSize, total, items: rows.map((row) => ({
      id: row.id, type: row.type, quantity: row.quantity.toNumber(),
      previousQuantity: row.previousQty.toNumber(), resultingQuantity: row.resultingQty.toNumber(),
      warehouseId: row.warehouseId, warehouseName: row.warehouse.name,
      referenceId: row.referenceId, referenceType: row.referenceType, notes: row.notes,
      occurredAt: row.occurredAt.toISOString(),
    })) };
  }

  async lots(id: string, page: number, pageSize: number) {
    const where = { productId: id };
    const [rows, total] = await prisma.$transaction([
      prisma.inventoryLot.findMany({
        where, orderBy: [{ expiresAt: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize, take: pageSize,
        include: { locationStocks: { select: { quantity: true, reserved: true } } },
      }),
      prisma.inventoryLot.count({ where }),
    ]);
    return { page, pageSize, total, items: rows.map((row) => ({
      id: row.id, lotNumber: row.lotNumber, serialNumber: row.serialNumber,
      status: row.status, manufacturedAt: row.manufacturedAt?.toISOString() ?? null,
      expiresAt: row.expiresAt?.toISOString() ?? null, receivedAt: row.receivedAt?.toISOString() ?? null,
      supplierRef: row.supplierRef,
      quantity: row.locationStocks.reduce((sum, stock) => sum + stock.quantity.toNumber(), 0),
      reserved: row.locationStocks.reduce((sum, stock) => sum + stock.reserved.toNumber(), 0),
    })) };
  }

  async units(id: string) {
    const rows = await prisma.productUnitConversion.findMany({
      where: { productId: id }, include: { unit: { select: { code: true, name: true, precision: true } } },
      orderBy: { unit: { name: "asc" } },
    });
    return rows.map((row) => ({ unitId: row.unitId, code: row.unit.code, name: row.unit.name,
      precision: row.unit.precision, factor: row.factor.toNumber() }));
  }

  async forecast(id: string) {
    const rows = await prisma.$queryRaw<{ week: Date; quantity: number }[]>`
      SELECT date_trunc('week', occurred_at)::date AS week, SUM(ABS(quantity))::float8 AS quantity
      FROM inventory.stock_movements
      WHERE product_id = ${id}::uuid AND type::text = 'OUTBOUND'
        AND occurred_at >= date_trunc('week', now()) - interval '12 weeks'
        AND occurred_at < date_trunc('week', now())
      GROUP BY 1 ORDER BY 1
    `;
    const byWeek = new Map(rows.map((row) => [row.week.toISOString().slice(0, 10), row.quantity]));
    const currentMonday = new Date();
    currentMonday.setUTCHours(0, 0, 0, 0);
    currentMonday.setUTCDate(currentMonday.getUTCDate() - ((currentMonday.getUTCDay() + 6) % 7));
    const weeks = Array.from({ length: 12 }, (_, index) => {
      const week = new Date(currentMonday);
      week.setUTCDate(week.getUTCDate() - (12 - index) * 7);
      const start = week.toISOString().slice(0, 10);
      return { week: start, quantity: byWeek.get(start) ?? 0 };
    });
    const hasHistory = rows.length > 0;
    return { weeks, forecastNextWeek: hasHistory
      ? weeks.slice(-4).reduce((sum, week) => sum + week.quantity, 0) / 4 : null,
      method: "Média das quatro semanas completas anteriores; apenas saídas de estoque." };
  }

  async list(query: ListProductsQuery): Promise<Page<ProductListItem>> {
    const { page, pageSize, skip, take } = pagination(query.page, query.pageSize);
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      // Arquivados só aparecem quando o filtro de status os pede.
      status: query.status ?? { not: "ARCHIVED" },
      ...(query.categoryId ? { categories: { some: { categoryId: query.categoryId } } } : {}),
      ...(query.q
        ? { OR: [{ sku: { contains: query.q, mode: "insensitive" } }, { name: { contains: query.q, mode: "insensitive" } }] }
        : {}),
    };

    const [total, rows] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], skip, take, include: detailInclude }),
    ]);

    const totals = await prisma.stockLevel.groupBy({
      by: ["productId"],
      where: { productId: { in: rows.map((row) => row.id) } },
      _sum: { quantity: true },
    });
    const quantityByProduct = new Map(totals.map((row) => [row.productId, row._sum.quantity?.toNumber() ?? 0]));

    return {
      page,
      pageSize,
      total,
      items: rows.map((row) => {
        const detail = toDetail(row);
        return {
          id: detail.id,
          sku: detail.sku,
          name: detail.name,
          unit: detail.unit,
          status: detail.status,
          isActive: detail.isActive,
          trackingMode: detail.trackingMode,
          minStock: detail.minStock,
          standardCost: detail.standardCost,
          salePrice: detail.salePrice,
          brand: detail.brand,
          currency: detail.currency,
          categoryId: detail.categoryId,
          categoryName: detail.categoryName,
          updatedAt: detail.updatedAt,
          totalQuantity: quantityByProduct.get(row.id) ?? 0,
        };
      }),
    };
  }

  async findById(id: string): Promise<ProductDetail | null> {
    const product = await prisma.product.findFirst({ where: { id, deletedAt: null }, include: detailInclude });
    if (!product) return null;
    const [stock, warehouses] = await Promise.all([
      prisma.stockLevel.aggregate({ where: { productId: id }, _sum: { quantity: true, reserved: true, incoming: true } }),
      prisma.stockLevel.count({ where: { productId: id } }),
    ]);
    const quantity = stock._sum.quantity?.toNumber() ?? 0;
    const reserved = stock._sum.reserved?.toNumber() ?? 0;
    return {
      ...toDetail(product),
      stockSummary: { quantity, reserved, available: quantity - reserved, incoming: stock._sum.incoming?.toNumber() ?? 0, warehouses },
    };
  }

  async create(input: CreateProductInput & { unit: string; actorId: string }): Promise<ProductDetail> {
    const { actorId, categoryId, barcodes = [], images = [], sku, ...rest } = input;
    try {
      const data: Prisma.ProductUncheckedCreateInput = {
        ...scalarFields(rest),
        sku: sku!,
        name: rest.name!,
        unit: rest.unit,
        baseUnitId: rest.baseUnitId!,
        createdBy: actorId,
        updatedBy: actorId,
        metadata: { images },
        ...(categoryId ? { categories: { create: { categoryId, isPrimary: true } } } : {}),
        ...(barcodes.length ? { barcodes: { create: barcodeRows(barcodes) } } : {}),
      };
      const created = await prisma.product.create({ data, include: detailInclude });
      return toDetail(created);
    } catch (error) {
      return translateConflict(error);
    }
  }

  async update(id: string, input: UpdateProductInput & { unit?: string; actorId: string }): Promise<ProductDetail> {
    const { actorId, categoryId, barcodes, images, ...rest } = input;
    try {
      const updated = await prisma.$transaction(async (tx) => {
        const currentMetadata = images === undefined ? null : (await tx.product.findUnique({ where: { id }, select: { metadata: true } }))?.metadata;
        if (categoryId !== undefined) {
          await tx.productCategory.deleteMany({ where: { productId: id } });
          if (categoryId) await tx.productCategory.create({ data: { productId: id, categoryId, isPrimary: true } });
        }
        if (barcodes !== undefined) {
          await tx.productBarcode.deleteMany({ where: { productId: id } });
          if (barcodes.length) await tx.productBarcode.createMany({ data: barcodeRows(barcodes).map((row) => ({ ...row, productId: id })) });
        }
        return tx.product.update({
          where: { id },
          data: {
            ...scalarFields(rest),
            ...(images !== undefined ? { metadata: {
              ...(typeof currentMetadata === "object" && currentMetadata !== null && !Array.isArray(currentMetadata) ? currentMetadata : {}),
              images,
            } } : {}),
            updatedBy: actorId, version: { increment: 1 },
          },
          include: detailInclude,
        });
      });
      return toDetail(updated);
    } catch (error) {
      return translateConflict(error);
    }
  }

  activeUnits(): Promise<UnitOption[]> {
    return prisma.unitOfMeasure.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true, type: true, precision: true },
    });
  }

  async existingSkus(skus: string[]): Promise<Set<string>> {
    const found = new Set<string>();
    for (const batch of chunks(skus)) {
      const rows = await prisma.product.findMany({ where: { sku: { in: batch } }, select: { sku: true } });
      for (const row of rows) found.add(row.sku);
    }
    return found;
  }

  async categoriesByPath(paths: string[]): Promise<Map<string, { isActive: boolean }>> {
    const rows = paths.length
      ? await prisma.category.findMany({ where: { path: { in: paths } }, select: { path: true, isActive: true, deletedAt: true } })
      : [];
    return new Map(rows.map((row) => [row.path, { isActive: row.isActive && row.deletedAt === null }]));
  }

  async applyImport(plan: ProductImportPlan, actorId: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        const paths = [...new Set([
          ...plan.categories.map((category) => category.path),
          ...plan.creates.flatMap((row) => (row.categoryPath ? [row.categoryPath] : [])),
          ...plan.updates.flatMap((row) => (row.categoryPath ? [row.categoryPath] : [])),
        ])];
        const parents = plan.categories.flatMap((category) => (category.parentPath ? [category.parentPath] : []));
        const known = await tx.category.findMany({
          where: { path: { in: [...paths, ...parents] } }, select: { id: true, path: true, depth: true },
        });
        const byPath = new Map(known.map((row) => [row.path, row]));

        if (plan.categories.length) {
          const taken = new Set((await tx.category.findMany({ select: { code: true } })).map((row) => row.code));
          for (const category of plan.categories) {
            if (byPath.has(category.path)) continue;
            const parent = category.parentPath ? byPath.get(category.parentPath) : undefined;
            const created = await tx.category.create({
              data: {
                code: categoryCode(category.path, taken), name: category.name,
                slug: category.path.split("/").at(-1)!, path: category.path,
                parentId: parent?.id ?? null, depth: parent ? parent.depth + 1 : 0,
              },
              select: { id: true, path: true, depth: true },
            });
            byPath.set(created.path, created);
          }
        }

        const links: Prisma.ProductCategoryCreateManyInput[] = [];
        const products: Prisma.ProductCreateManyInput[] = plan.creates.map(({ categoryPath, categoryId: _category, barcodes: _barcodes, images: _images, ...row }) => {
          const id = randomUUID();
          if (categoryPath) links.push({ productId: id, categoryId: byPath.get(categoryPath)!.id, isPrimary: true });
          return { ...scalarFields(row), id, sku: row.sku, name: row.name, unit: row.unit, baseUnitId: row.baseUnitId,
            createdBy: actorId, updatedBy: actorId, metadata: { images: [] } };
        });
        for (const batch of chunks(products)) await tx.product.createMany({ data: batch });
        for (const batch of chunks(links)) await tx.productCategory.createMany({ data: batch });

        // Vínculos de categoria trocados em lote: uma query por produto em vez de três.
        const relinked: string[] = [];
        const relinks: Prisma.ProductCategoryCreateManyInput[] = [];
        for (const update of plan.updates) {
          const product = await tx.product.update({
            where: { sku: update.sku },
            data: { ...scalarFields(update.input), updatedBy: actorId, version: { increment: 1 } },
            select: { id: true },
          });
          if (update.categoryPath === undefined) continue;
          relinked.push(product.id);
          if (update.categoryPath) relinks.push({ productId: product.id, categoryId: byPath.get(update.categoryPath)!.id, isPrimary: true });
        }
        for (const batch of chunks(relinked)) await tx.productCategory.deleteMany({ where: { productId: { in: batch } } });
        for (const batch of chunks(relinks)) await tx.productCategory.createMany({ data: batch });
      }, { timeout: 120_000, maxWait: 10_000 });
    } catch (error) {
      translateConflict(error);
    }
  }

  async findUnit(id: string): Promise<UnitOption | null> {
    return prisma.unitOfMeasure.findFirst({
      where: { id, isActive: true },
      select: { id: true, code: true, name: true, type: true, precision: true },
    });
  }

  async categoryExists(id: string): Promise<boolean> {
    return (await prisma.category.count({ where: { id, isActive: true, deletedAt: null } })) > 0;
  }

  async lookups(): Promise<{ units: UnitOption[]; categories: CategoryOption[] }> {
    const [units, categories] = await Promise.all([
      prisma.unitOfMeasure.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, code: true, name: true, type: true, precision: true },
      }),
      prisma.category.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: [{ path: "asc" }],
        select: { id: true, code: true, name: true, path: true, depth: true },
      }),
    ]);
    return { units, categories };
  }
}
