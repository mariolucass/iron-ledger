import type { PrismaClient } from "@prisma/client";
import type { StockAvailability, StockAvailabilityPort } from "../../application/ports/stock-availability.port";

/** Adaptador da ACL: lê a projeção mínima do saldo no schema `inventory`. */
export class PrismaStockAvailability implements StockAvailabilityPort {
  constructor(private readonly prisma: PrismaClient) {}

  async find(stockLevelId: string): Promise<StockAvailability | null> {
    const stock = await this.prisma.stockLevel.findUnique({
      where: { id: stockLevelId },
      include: {
        product: { select: { sku: true, isActive: true, deletedAt: true } },
        warehouse: { select: { isActive: true } },
      },
    });
    if (!stock) return null;
    return {
      stockLevelId: stock.id,
      productId: stock.productId,
      warehouseId: stock.warehouseId,
      sku: stock.product.sku,
      available: stock.quantity.minus(stock.reserved).toNumber(),
      isSellable: stock.product.isActive && !stock.product.deletedAt && stock.warehouse.isActive,
    };
  }
}
