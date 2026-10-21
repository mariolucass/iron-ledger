import type { PrismaClient } from "@prisma/client";
import { usersFromEnv } from "./data/identity.data";
import { stockLevels, stockMovements } from "./data/inventory.data";
import { seedId, type Seed } from "./types";

/** Resolve IDs pelas chaves naturais, para o seed funcionar sobre dados já existentes. */
async function resolveRefs(prisma: PrismaClient, sku: string, warehouseCode: string) {
  const [product, warehouse] = await Promise.all([
    prisma.product.findUniqueOrThrow({ where: { sku }, select: { id: true } }),
    prisma.warehouse.findUniqueOrThrow({ where: { code: warehouseCode }, select: { id: true } }),
  ]);
  return { productId: product.id, warehouseId: warehouse.id };
}

export const inventorySeed: Seed = {
  name: "inventory",
  dependsOn: ["identity", "catalog", "warehouse"],
  async run({ prisma, log }) {
    for (const [index, stock] of stockLevels.entries()) {
      const refs = await resolveRefs(prisma, stock.sku, stock.warehouse);
      await prisma.stockLevel.upsert({
        where: { productId_warehouseId: refs },
        update: { quantity: stock.quantity, reserved: stock.reserved },
        create: {
          id: seedId(30000000, index + 1),
          ...refs,
          quantity: stock.quantity,
          reserved: stock.reserved,
        },
      });

      if (stock.reserved > 0) {
        const reservationId = seedId(40000000, index + 1);
        await prisma.stockReservation.upsert({
          where: { id: reservationId },
          update: { quantity: stock.reserved, status: "ACTIVE" },
          create: { id: reservationId, ...refs, quantity: stock.reserved },
        });
      }
    }

    const adminEmail = usersFromEnv(process.env)[0]?.email ?? "";
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: adminEmail },
      select: { id: true },
    });

    for (const movement of stockMovements) {
      const refs = await resolveRefs(prisma, movement.sku, movement.warehouse);
      await prisma.stockMovement.upsert({
        where: { id: movement.id },
        update: {},
        create: {
          id: movement.id,
          ...refs,
          type: movement.type,
          quantity: movement.quantity,
          previousQty: movement.previousQty,
          resultingQty: movement.resultingQty,
          referenceId: movement.referenceId,
          referenceType: movement.type === "ADJUSTMENT" ? "ADJUSTMENT" : "TRANSACTION",
          performedBy: admin.id,
          createdAt: movement.createdAt,
        },
      });
    }

    log(`${stockLevels.length} saldos, ${stockMovements.length} movimentações`);
  },
};
