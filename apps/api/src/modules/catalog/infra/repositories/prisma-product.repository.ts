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
  const { categoryId: _category, barcodes: _barcodes, status, ...rest } = input;
  return {
    ...rest,
    ...(status ? { status, isActive: status === "ACTIVE" } : {}),
  };
}

export class PrismaProductRepository implements ProductRepository {
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
    return product ? toDetail(product) : null;
  }

  async create(input: CreateProductInput & { unit: string; actorId: string }): Promise<ProductDetail> {
    const { actorId, categoryId, barcodes = [], sku, ...rest } = input;
    try {
      const data: Prisma.ProductUncheckedCreateInput = {
        ...scalarFields(rest),
        sku: sku!,
        name: rest.name!,
        unit: rest.unit,
        baseUnitId: rest.baseUnitId!,
        createdBy: actorId,
        updatedBy: actorId,
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
    const { actorId, categoryId, barcodes, ...rest } = input;
    try {
      const updated = await prisma.$transaction(async (tx) => {
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
          data: { ...scalarFields(rest), updatedBy: actorId, version: { increment: 1 } },
          include: detailInclude,
        });
      });
      return toDetail(updated);
    } catch (error) {
      return translateConflict(error);
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
