import { warehouses } from "./data/warehouse.data";
import type { Seed } from "./types";

export const warehouseSeed: Seed = {
  name: "warehouse",
  async run({ prisma, log }) {
    for (const warehouse of warehouses) {
      await prisma.warehouse.upsert({
        where: { code: warehouse.code },
        update: {
          name: warehouse.name,
          address: warehouse.address,
          isActive: true,
          deletedAt: null,
        },
        create: warehouse,
      });
    }
    log(`${warehouses.length} depósitos`);
  },
};
