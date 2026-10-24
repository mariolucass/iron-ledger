import { Prisma } from "@prisma/client";
import { prisma } from "../../../../infra/database/prisma.client";
import { AppError } from "../../../../shared/errors/domain.error";
import type { CreateUnitInput, ListUnitsQuery, UnitItem, UnitRepository } from "../../application/unit-of-measure";

const mapUnit = (item: { id: string; code: string; name: string; type: UnitItem["type"]; precision: number; isActive: boolean; createdAt: Date; updatedAt: Date }): UnitItem => ({
  ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString(),
});
export class PrismaUnitRepository implements UnitRepository {
  async list(query: ListUnitsQuery) {
    const where: Prisma.UnitOfMeasureWhereInput = query.q ? {
      OR: [{ code: { contains: query.q, mode: "insensitive" } }, { name: { contains: query.q, mode: "insensitive" } }],
    } : {};
    const [items, total] = await prisma.$transaction([
      prisma.unitOfMeasure.findMany({ where, orderBy: [{ name: "asc" }, { code: "asc" }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
      prisma.unitOfMeasure.count({ where }),
    ]);
    return { items: items.map(mapUnit), total, page: query.page, pageSize: query.pageSize };
  }
  async create(input: CreateUnitInput) {
    try { return mapUnit(await prisma.unitOfMeasure.create({ data: input })); }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("Já existe uma unidade com este código", 409, "UNIT_CODE_ALREADY_EXISTS");
      }
      throw error;
    }
  }
}
