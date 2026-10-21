import { Prisma } from "@prisma/client";
import { AppError } from "../../../../shared/errors/domain.error";
import { prisma } from "../../../../infra/database/prisma.client";
import { pagination } from "../../../../shared/utils/pagination";
import type {
  CreateLocationInput,
  CreateWarehouseInput,
  ListWarehousesQuery,
  LocationNode,
  Page,
  UpdateLocationInput,
  UpdateWarehouseInput,
  WarehouseDetail,
  WarehouseListItem,
  WarehouseRepository,
  WarehouseStockSummary,
} from "../../application/warehouse";

const num = (value: Prisma.Decimal | null): number | null => (value === null ? null : value.toNumber());

const composeAddress = (w: { addressLine: string | null; city: string | null; state: string | null; postalCode: string | null }) =>
  [w.addressLine, [w.city, w.state].filter(Boolean).join(", "), w.postalCode].filter(Boolean).join(" · ") || null;

function toLocation(row: Prisma.WarehouseLocationGetPayload<object>): LocationNode {
  return {
    id: row.id,
    parentId: row.parentId,
    code: row.code,
    name: row.name,
    type: row.type,
    path: row.path,
    isPickable: row.isPickable,
    isReceivable: row.isReceivable,
    isActive: row.isActive,
    maxWeightKg: num(row.maxWeightKg),
    maxVolumeM3: num(row.maxVolumeM3),
    pickSequence: row.pickSequence,
  };
}

function conflict(error: unknown, message: string, code: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new AppError(message, 409, code);
  }
  throw error;
}

export class PrismaWarehouseRepository implements WarehouseRepository {
  private async stockSummary(ids: string[]): Promise<Map<string, WarehouseStockSummary>> {
    const rows = await prisma.stockLevel.groupBy({
      by: ["warehouseId"],
      where: { warehouseId: { in: ids } },
      _sum: { quantity: true, reserved: true },
      _count: { productId: true },
    });
    return new Map(
      rows.map((row) => [
        row.warehouseId,
        {
          skuCount: row._count.productId,
          totalQuantity: row._sum.quantity?.toNumber() ?? 0,
          reserved: row._sum.reserved?.toNumber() ?? 0,
        },
      ]),
    );
  }

  async list(query: ListWarehousesQuery): Promise<Page<WarehouseListItem>> {
    const { page, pageSize, skip, take } = pagination(query.page, query.pageSize, 200);
    const where: Prisma.WarehouseWhereInput = {
      deletedAt: null,
      ...(query.status === "all" ? {} : { isActive: query.status === "active" }),
      ...(query.type ? { type: query.type } : {}),
      ...(query.q
        ? {
            OR: [
              { code: { contains: query.q, mode: "insensitive" } },
              { name: { contains: query.q, mode: "insensitive" } },
              { city: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, rows] = await prisma.$transaction([
      prisma.warehouse.count({ where }),
      prisma.warehouse.findMany({
        where,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        skip,
        take,
        include: { _count: { select: { locations: { where: { deletedAt: null } } } } },
      }),
    ]);
    const stock = await this.stockSummary(rows.map((row) => row.id));

    return {
      page,
      pageSize,
      total,
      items: rows.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        type: row.type,
        address: row.address,
        city: row.city,
        state: row.state,
        isActive: row.isActive,
        locationCount: row._count.locations,
        ...(stock.get(row.id) ?? { skuCount: 0, totalQuantity: 0, reserved: 0 }),
      })),
    };
  }

  async findById(id: string): Promise<WarehouseDetail | null> {
    const row = await prisma.warehouse.findFirst({
      where: { id, deletedAt: null },
      include: { locations: { where: { deletedAt: null }, orderBy: [{ path: "asc" }] } },
    });
    if (!row) return null;
    const stock = (await this.stockSummary([id])).get(id) ?? { skuCount: 0, totalQuantity: 0, reserved: 0 };
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      type: row.type,
      address: row.address,
      addressLine: row.addressLine,
      city: row.city,
      state: row.state,
      postalCode: row.postalCode,
      countryCode: row.countryCode,
      latitude: num(row.latitude),
      longitude: num(row.longitude),
      timezone: row.timezone,
      taxId: row.taxId,
      isActive: row.isActive,
      version: row.version,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      locations: row.locations.map(toLocation),
      ...stock,
    };
  }

  async create(input: CreateWarehouseInput): Promise<WarehouseDetail> {
    const structured = {
      addressLine: input.addressLine ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      postalCode: input.postalCode ?? null,
    };
    try {
      const created = await prisma.warehouse.create({
        data: { ...input, code: input.code!, name: input.name!, address: composeAddress(structured) },
      });
      return (await this.findById(created.id))!;
    } catch (error) {
      return conflict(error, "Já existe um armazém com este código", "WAREHOUSE_CODE_EXISTS");
    }
  }

  async update(id: string, input: UpdateWarehouseInput): Promise<WarehouseDetail> {
    const touchesAddress = ["addressLine", "city", "state", "postalCode"].some((key) => key in input);
    let address: { address: string | null } | object = {};
    if (touchesAddress) {
      const current = await prisma.warehouse.findUniqueOrThrow({ where: { id } });
      address = { address: composeAddress({ ...current, ...input }) };
    }
    await prisma.warehouse.update({ where: { id }, data: { ...input, ...address, version: { increment: 1 } } });
    return (await this.findById(id))!;
  }

  async stockOnHand(id: string): Promise<number> {
    const { _sum } = await prisma.stockLevel.aggregate({ where: { warehouseId: id }, _sum: { quantity: true } });
    return _sum.quantity?.toNumber() ?? 0;
  }

  async findLocation(warehouseId: string, locationId: string): Promise<LocationNode | null> {
    const row = await prisma.warehouseLocation.findFirst({ where: { id: locationId, warehouseId, deletedAt: null } });
    return row ? toLocation(row) : null;
  }

  async createLocation(warehouseId: string, input: CreateLocationInput & { path: string }): Promise<LocationNode> {
    try {
      const created = await prisma.warehouseLocation.create({
        data: { ...input, code: input.code!, type: input.type!, warehouseId },
      });
      return toLocation(created);
    } catch (error) {
      return conflict(error, "Já existe uma localização com este código neste armazém", "LOCATION_CODE_EXISTS");
    }
  }

  async updateLocation(locationId: string, input: UpdateLocationInput): Promise<LocationNode> {
    return toLocation(await prisma.warehouseLocation.update({ where: { id: locationId }, data: input }));
  }

  async locationStockOnHand(locationId: string): Promise<number> {
    const { _sum } = await prisma.locationStock.aggregate({ where: { locationId }, _sum: { quantity: true } });
    return _sum.quantity?.toNumber() ?? 0;
  }

  activeChildCount(locationId: string): Promise<number> {
    return prisma.warehouseLocation.count({ where: { parentId: locationId, isActive: true, deletedAt: null } });
  }
}
