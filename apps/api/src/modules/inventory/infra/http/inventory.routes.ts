import { Router } from "express";
import { prisma } from "../../../../infra/database/prisma.client";

export function createInventoryRouter(): Router {
  const router = Router();

  router.get("/", async (_request, response, next) => {
    try {
      const [products, warehouses] = await Promise.all([
        prisma.product.findMany({
          where: { deletedAt: null },
          orderBy: { name: "asc" },
          include: {
            stockLevels: {
              include: { warehouse: { select: { id: true, code: true, name: true, isActive: true } } },
              orderBy: { warehouse: { name: "asc" } },
            },
          },
        }),
        prisma.warehouse.findMany({
          where: { isActive: true },
          orderBy: { name: "asc" },
          select: { id: true, code: true, name: true },
        }),
      ]);
      const movements = products.length
        ? await prisma.stockMovement.groupBy({
            by: ["productId", "warehouseId"],
            where: { productId: { in: products.map((product) => product.id) } },
            _max: { createdAt: true },
          })
        : [];
      const latestMovement = new Map<string, Date>();
      for (const movement of movements) {
        const key = `${movement.productId}:${movement.warehouseId}`;
        if (movement._max.createdAt) latestMovement.set(key, movement._max.createdAt);
      }

      const rows = products.flatMap((product) =>
        product.stockLevels.map((level) => {
          const quantity = Number(level.quantity);
          const reserved = Number(level.reserved);
          const available = quantity - reserved;
          const min = Number(product.minStock);
          const status = available <= 0 ? "CRITICAL" : available < min ? "LOW" : "OK";
          return {
            id: level.id,
            productId: product.id,
            sku: product.sku,
            product: product.name,
            unit: product.unit,
            warehouseId: level.warehouse.id,
            warehouse: level.warehouse.name,
            quantity,
            available,
            reserved,
            min,
            status,
            lastMovement: latestMovement.get(`${product.id}:${level.warehouse.id}`)?.toISOString() ?? "—",
            updatedAt: level.updatedAt,
          };
        }),
      );

      response.json({
        data: rows,
        warehouses,
        summary: {
          products: products.length,
          warehouses: warehouses.length,
          stockItems: rows.length,
          critical: rows.filter((row) => row.status === "CRITICAL").length,
          low: rows.filter((row) => row.status === "LOW").length,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
