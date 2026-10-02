import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@ironledger.local").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 12);

  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN", description: "Administrador do sistema", isSystem: true },
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: { name: "Administrador", passwordHash, status: "ACTIVE", deletedAt: null },
    create: { email, name: "Administrador", passwordHash },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
    update: {},
    create: { userId: user.id, roleId: adminRole.id },
  });

  const warehouseInputs = [
    { code: "WH-CENTRO", name: "Loja Centro", address: "São Paulo, SP" },
    { code: "WH-SUL", name: "Estoque Sul", address: "Curitiba, PR" },
    { code: "WH-NORTE", name: "Estoque Norte", address: "Manaus, AM" },
  ];
  const warehouseByCode = new Map<string, string>();
  for (const input of warehouseInputs) {
    const warehouse = await prisma.warehouse.upsert({
      where: { code: input.code },
      update: { name: input.name, address: input.address, isActive: true },
      create: input,
    });
    warehouseByCode.set(input.code, warehouse.id);
  }

  const productInputs = [
    { sku: "SKU-4821-A", name: "Tênis Esportivo", unit: "par", minStock: 5 },
    { sku: "SKU-3910-B", name: "Camiseta Premium", unit: "un", minStock: 15 },
    { sku: "SKU-2201-C", name: "Jaqueta Urbana", unit: "un", minStock: 8 },
    { sku: "SKU-1092-D", name: "Calça Jeans Slim", unit: "un", minStock: 15 },
    { sku: "SKU-7832-F", name: "Moletom com Capuz", unit: "un", minStock: 20 },
  ];
  const productBySku = new Map<string, string>();
  for (const input of productInputs) {
    const product = await prisma.product.upsert({
      where: { sku: input.sku },
      update: { name: input.name, unit: input.unit, minStock: input.minStock, isActive: true, deletedAt: null },
      create: input,
    });
    productBySku.set(input.sku, product.id);
  }

  const balances: [string, string, number, number][] = [
    ["SKU-4821-A", "WH-CENTRO", 3, 1], ["SKU-4821-A", "WH-SUL", 12, 0],
    ["SKU-3910-B", "WH-SUL", 10, 2], ["SKU-3910-B", "WH-NORTE", 32, 0],
    ["SKU-2201-C", "WH-CENTRO", 3, 0], ["SKU-2201-C", "WH-NORTE", 11, 1],
    ["SKU-1092-D", "WH-NORTE", 17, 3], ["SKU-1092-D", "WH-SUL", 28, 0],
    ["SKU-7832-F", "WH-CENTRO", 142, 14], ["SKU-7832-F", "WH-SUL", 65, 5],
  ];
  for (const [sku, warehouseCode, quantity, reserved] of balances) {
    const productId = productBySku.get(sku)!;
    const warehouseId = warehouseByCode.get(warehouseCode)!;
    await prisma.stockLevel.upsert({
      where: { productId_warehouseId: { productId, warehouseId } },
      update: { quantity, reserved },
      create: { productId, warehouseId, quantity, reserved },
    });
  }

  console.log(`Usuário inicial e inventário de demonstração criados/atualizados: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
