import { loadWorkspaceEnv } from "../../../scripts/app-env.cjs";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

Object.assign(process.env, loadWorkspaceEnv("api"));
const prisma = new PrismaClient();

const demoWarehouses = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    code: "WH-CENTRO",
    name: "Loja Centro",
    address: "São Paulo, SP",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    code: "WH-SUL",
    name: "Estoque Sul",
    address: "Curitiba, PR",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    code: "WH-NORTE",
    name: "Estoque Norte",
    address: "Manaus, AM",
  },
] as const;

const demoProducts = [
  { id: "20000000-0000-4000-8000-000000000001", sku: "SKU-4821-A", name: "Tênis Esportivo Nike Air", minStock: 5, maxStock: 100, category: "Calçados" },
  { id: "20000000-0000-4000-8000-000000000002", sku: "SKU-3910-B", name: "Camiseta de Algodão Premium", minStock: 15, maxStock: 300, category: "Vestuário" },
  { id: "20000000-0000-4000-8000-000000000003", sku: "SKU-2201-C", name: "Jaqueta de Couro Sintético", minStock: 8, maxStock: 100, category: "Vestuário" },
  { id: "20000000-0000-4000-8000-000000000004", sku: "SKU-1092-D", name: "Calça Jeans Slim Fit", minStock: 15, maxStock: 200, category: "Vestuário" },
  { id: "20000000-0000-4000-8000-000000000005", sku: "SKU-7832-F", name: "Moletom com Capuz", minStock: 20, maxStock: 300, category: "Vestuário" },
] as const;

const demoStock = [
  { product: 0, warehouse: 0, quantity: 3, reserved: 1 },
  { product: 1, warehouse: 1, quantity: 10, reserved: 2 },
  { product: 2, warehouse: 0, quantity: 3, reserved: 0 },
  { product: 3, warehouse: 2, quantity: 17, reserved: 3 },
  { product: 4, warehouse: 0, quantity: 142, reserved: 14 },
] as const;

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

  const warehousesByCode = new Map<string, { id: string }>();
  for (const warehouse of demoWarehouses) {
    const savedWarehouse = await prisma.warehouse.upsert({
      where: { code: warehouse.code },
      update: { name: warehouse.name, address: warehouse.address, isActive: true },
      create: warehouse,
    });
    warehousesByCode.set(warehouse.code, savedWarehouse);
  }

  const productsBySku = new Map<string, { id: string }>();
  for (const product of demoProducts) {
    const savedProduct = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        minStock: product.minStock,
        maxStock: product.maxStock,
        metadata: { category: product.category },
        isActive: true,
        deletedAt: null,
      },
      create: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        minStock: product.minStock,
        maxStock: product.maxStock,
        metadata: { category: product.category },
      },
    });
    productsBySku.set(product.sku, savedProduct);
  }

  for (const [index, stock] of demoStock.entries()) {
    const productConfig = demoProducts[stock.product];
    const warehouseConfig = demoWarehouses[stock.warehouse];
    const product = productsBySku.get(productConfig.sku);
    const warehouse = warehousesByCode.get(warehouseConfig.code);
    if (!product || !warehouse) throw new Error("Falha ao resolver a massa de demonstração.");
    await prisma.stockLevel.upsert({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: warehouse.id,
        },
      },
      update: { quantity: stock.quantity, reserved: stock.reserved },
      create: {
        id: `30000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: stock.quantity,
        reserved: stock.reserved,
      },
    });

    if (stock.reserved > 0) {
      await prisma.stockReservation.upsert({
        where: { id: `40000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}` },
        update: { quantity: stock.reserved, status: "ACTIVE" },
        create: {
          id: `40000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
          productId: product.id,
          warehouseId: warehouse.id,
          quantity: stock.reserved,
        },
      });
    }
  }

  const demoMovements = [
    { id: "50000000-0000-4000-8000-000000000001", product: 0, warehouse: 0, type: "OUTBOUND" as const, quantity: 3, previousQty: 6, resultingQty: 3, referenceId: "TXN-00483910", createdAt: new Date("2026-06-09T14:32:00Z") },
    { id: "50000000-0000-4000-8000-000000000002", product: 0, warehouse: 0, type: "INBOUND" as const, quantity: 5, previousQty: 1, resultingQty: 6, referenceId: "TXN-00483905", createdAt: new Date("2026-06-08T10:15:00Z") },
    { id: "50000000-0000-4000-8000-000000000003", product: 0, warehouse: 0, type: "ADJUSTMENT" as const, quantity: -1, previousQty: 2, resultingQty: 1, referenceId: "ADJ-00000821", createdAt: new Date("2026-06-07T09:00:00Z") },
  ];

  for (const movement of demoMovements) {
    const product = productsBySku.get(demoProducts[movement.product]?.sku ?? "");
    const warehouse = warehousesByCode.get(demoWarehouses[movement.warehouse]?.code ?? "");
    if (!product || !warehouse) throw new Error("Falha ao resolver a massa de demonstração.");
    await prisma.stockMovement.upsert({
      where: { id: movement.id },
      update: {},
      create: {
        id: movement.id,
        productId: product.id,
        warehouseId: warehouse.id,
        type: movement.type,
        quantity: movement.quantity,
        previousQty: movement.previousQty,
        resultingQty: movement.resultingQty,
        referenceId: movement.referenceId,
        referenceType: movement.type === "ADJUSTMENT" ? "ADJUSTMENT" : "TRANSACTION",
        performedBy: user.id,
        createdAt: movement.createdAt,
      },
    });
  }

  console.log(`Usuário inicial criado/atualizado: ${email}`);
  console.log(`${demoWarehouses.length} depósitos, ${demoProducts.length} produtos e ${demoStock.length} saldos preparados para demonstração.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
