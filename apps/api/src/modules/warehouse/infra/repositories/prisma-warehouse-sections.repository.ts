import { prisma } from "../../../../infra/database/prisma.client";
import type {
  WarehouseSection,
  WarehouseSectionsRepository,
} from "../../application/warehouse-sections";

export class PrismaWarehouseSectionsRepository implements WarehouseSectionsRepository {
  async section(id: string, section: WarehouseSection, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    switch (section) {
      case "inventory": {
        const where = { warehouseId: id };
        const [rows, total] = await prisma.$transaction([
          prisma.stockLevel.findMany({
            where,
            orderBy: { product: { name: "asc" } },
            skip,
            take: pageSize,
            include: { product: { select: { sku: true, name: true, unit: true, minStock: true } } },
          }),
          prisma.stockLevel.count({ where }),
        ]);
        return {
          page,
          pageSize,
          total,
          items: rows.map((row) => ({
            id: row.id,
            productId: row.productId,
            sku: row.product.sku,
            productName: row.product.name,
            unit: row.product.unit,
            minStock: row.product.minStock.toNumber(),
            quantity: row.quantity.toNumber(),
            reserved: row.reserved.toNumber(),
            available: row.quantity.minus(row.reserved).toNumber(),
            incoming: row.incoming.toNumber(),
          })),
        };
      }
      case "movements": {
        const where = { warehouseId: id };
        const [rows, total] = await prisma.$transaction([
          prisma.stockMovement.findMany({
            where,
            orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
            skip,
            take: pageSize,
            include: { product: { select: { sku: true, name: true, unit: true } } },
          }),
          prisma.stockMovement.count({ where }),
        ]);
        return {
          page,
          pageSize,
          total,
          items: rows.map((row) => ({
            id: row.id,
            productId: row.productId,
            sku: row.product.sku,
            productName: row.product.name,
            unit: row.product.unit,
            type: row.type,
            quantity: row.quantity.toNumber(),
            referenceId: row.referenceId,
            notes: row.notes,
            occurredAt: row.occurredAt.toISOString(),
          })),
        };
      }
      case "reservations": {
        const where = { warehouseId: id };
        const [rows, total] = await prisma.$transaction([
          prisma.stockReservation.findMany({
            where,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip,
            take: pageSize,
            include: { product: { select: { sku: true, name: true, unit: true } } },
          }),
          prisma.stockReservation.count({ where }),
        ]);
        return {
          page,
          pageSize,
          total,
          items: rows.map((row) => ({
            id: row.id,
            productId: row.productId,
            sku: row.product.sku,
            productName: row.product.name,
            unit: row.product.unit,
            quantity: row.quantity.toNumber(),
            status: row.status,
            transactionId: row.transactionId,
            expiresAt: row.expiresAt?.toISOString() ?? null,
            createdAt: row.createdAt.toISOString(),
          })),
        };
      }
      case "transfers": {
        const where = { OR: [{ sourceWarehouseId: id }, { destinationWarehouseId: id }] };
        const [rows, total] = await prisma.$transaction([
          prisma.stockTransfer.findMany({
            where,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip,
            take: pageSize,
            include: {
              sourceWarehouse: { select: { name: true } },
              destinationWarehouse: { select: { name: true } },
              _count: { select: { items: true } },
            },
          }),
          prisma.stockTransfer.count({ where }),
        ]);
        return {
          page,
          pageSize,
          total,
          items: rows.map((row) => ({
            id: row.id,
            code: row.code,
            status: row.status,
            direction: row.sourceWarehouseId === id ? "OUTBOUND" : "INBOUND",
            sourceName: row.sourceWarehouse.name,
            destinationName: row.destinationWarehouse.name,
            itemCount: row._count.items,
            requestedAt: row.requestedAt.toISOString(),
            expectedAt: row.expectedAt?.toISOString() ?? null,
          })),
        };
      }
      case "counts": {
        const where = { warehouseId: id };
        const [rows, total] = await prisma.$transaction([
          prisma.stockCount.findMany({
            where,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip,
            take: pageSize,
            include: { _count: { select: { items: true } } },
          }),
          prisma.stockCount.count({ where }),
        ]);
        return {
          page,
          pageSize,
          total,
          items: rows.map((row) => ({
            id: row.id,
            code: row.code,
            type: row.type,
            status: row.status,
            isBlind: row.isBlind,
            itemCount: row._count.items,
            scheduledAt: row.scheduledAt?.toISOString() ?? null,
            startedAt: row.startedAt?.toISOString() ?? null,
            completedAt: row.completedAt?.toISOString() ?? null,
            createdAt: row.createdAt.toISOString(),
          })),
        };
      }
      case "access": {
        const rows = await prisma.userWarehouseAccess.findMany({
          where: { warehouseId: id },
          orderBy: { grantedAt: "desc" },
          include: { user: { select: { id: true, name: true, email: true, status: true } } },
        });
        return rows.map((row) => ({
          userId: row.userId,
          name: row.user.name,
          email: row.user.email,
          userStatus: row.user.status,
          accessLevel: row.accessLevel,
          grantedAt: row.grantedAt.toISOString(),
          expiresAt: row.expiresAt?.toISOString() ?? null,
        }));
      }
      case "settings": {
        const rows = await prisma.setting.findMany({
          where: { scope: "WAREHOUSE", scopeId: id, isSecret: false },
          orderBy: { key: "asc" },
        });
        return rows.map((row) => ({
          key: row.key,
          value: row.value,
          description: row.description,
          version: row.version,
          updatedAt: row.updatedAt.toISOString(),
        }));
      }
    }
  }

  async location(id: string, locationId: string) {
    const row = await prisma.warehouseLocation.findFirst({
      where: { id: locationId, warehouseId: id, deletedAt: null },
      include: {
        locationStocks: { include: { product: { select: { sku: true, name: true, unit: true } } } },
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      parentId: row.parentId,
      code: row.code,
      name: row.name,
      path: row.path,
      type: row.type,
      isActive: row.isActive,
      isPickable: row.isPickable,
      isReceivable: row.isReceivable,
      maxWeightKg: row.maxWeightKg?.toNumber() ?? null,
      maxVolumeM3: row.maxVolumeM3?.toNumber() ?? null,
      pickSequence: row.pickSequence,
      stocks: row.locationStocks.map((stock) => ({
        id: stock.id,
        productId: stock.productId,
        sku: stock.product.sku,
        productName: stock.product.name,
        unit: stock.product.unit,
        quantity: stock.quantity.toNumber(),
        reserved: stock.reserved.toNumber(),
      })),
    };
  }
}
