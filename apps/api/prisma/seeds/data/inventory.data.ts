import type { ProductSku } from "./catalog.data";
import type { WarehouseCode } from "./warehouse.data";

interface StockSeed {
  sku: ProductSku;
  warehouse: WarehouseCode;
  quantity: number;
  reserved: number;
}

interface MovementSeed {
  id: string;
  sku: ProductSku;
  warehouse: WarehouseCode;
  type: "INBOUND" | "OUTBOUND" | "ADJUSTMENT";
  quantity: number;
  previousQty: number;
  resultingQty: number;
  referenceId: string;
  createdAt: Date;
}

export const stockLevels: readonly StockSeed[] = [
  { sku: "SKU-4821-A", warehouse: "WH-CENTRO", quantity: 3, reserved: 1 },
  { sku: "SKU-3910-B", warehouse: "WH-SUL", quantity: 10, reserved: 2 },
  { sku: "SKU-2201-C", warehouse: "WH-CENTRO", quantity: 3, reserved: 0 },
  { sku: "SKU-1092-D", warehouse: "WH-NORTE", quantity: 17, reserved: 3 },
  { sku: "SKU-7832-F", warehouse: "WH-CENTRO", quantity: 142, reserved: 14 },
];

export const stockMovements: readonly MovementSeed[] = [
  {
    id: "50000000-0000-4000-8000-000000000001",
    sku: "SKU-4821-A",
    warehouse: "WH-CENTRO",
    type: "OUTBOUND",
    quantity: 3,
    previousQty: 6,
    resultingQty: 3,
    referenceId: "TXN-00483910",
    createdAt: new Date("2026-06-09T14:32:00Z"),
  },
  {
    id: "50000000-0000-4000-8000-000000000002",
    sku: "SKU-4821-A",
    warehouse: "WH-CENTRO",
    type: "INBOUND",
    quantity: 5,
    previousQty: 1,
    resultingQty: 6,
    referenceId: "TXN-00483905",
    createdAt: new Date("2026-06-08T10:15:00Z"),
  },
  {
    id: "50000000-0000-4000-8000-000000000003",
    sku: "SKU-4821-A",
    warehouse: "WH-CENTRO",
    type: "ADJUSTMENT",
    quantity: -1,
    previousQty: 2,
    resultingQty: 1,
    referenceId: "ADJ-00000821",
    createdAt: new Date("2026-06-07T09:00:00Z"),
  },
];
