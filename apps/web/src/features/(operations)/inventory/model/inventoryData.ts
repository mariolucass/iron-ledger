export interface InventoryItem {
  stockLevelId?: string;
  sku: string;
  product: string;
  warehouse: string;
  available: number;
  reserved: number;
  min: number;
  status: "CRITICAL" | "LOW" | "OK";
  lastMovement: string;
}

export interface Movement {
  type: "ENTRADA" | "SAÍDA" | "AJUSTE";
  qty: string;
  ref: string;
  by: string;
  ts: string;
}

export const warehouses = [
  "Todos os estoques",
  "Loja Centro",
  "Estoque Sul",
  "Estoque Norte",
];

export const inventoryData: InventoryItem[] = [
  {
    sku: "SKU-4821-A",
    product: "Tênis Esportivo Nike Air",
    warehouse: "Loja Centro",
    available: 2,
    reserved: 1,
    min: 5,
    status: "CRITICAL",
    lastMovement: "2026-06-09 14:32",
  },
  {
    sku: "SKU-3910-B",
    product: "Camiseta de Algodão Premium",
    warehouse: "Estoque Sul",
    available: 8,
    reserved: 2,
    min: 15,
    status: "LOW",
    lastMovement: "2026-06-09 12:15",
  },
  {
    sku: "SKU-2201-C",
    product: "Jaqueta de Couro Sintético",
    warehouse: "Loja Centro",
    available: 3,
    reserved: 0,
    min: 8,
    status: "CRITICAL",
    lastMovement: "2026-06-09 11:00",
  },
  {
    sku: "SKU-1092-D",
    product: "Calça Jeans Slim Fit",
    warehouse: "Estoque Norte",
    available: 14,
    reserved: 3,
    min: 15,
    status: "LOW",
    lastMovement: "2026-06-08 16:40",
  },
  {
    sku: "SKU-7832-F",
    product: "Moletom com Capuz",
    warehouse: "Loja Centro",
    available: 128,
    reserved: 14,
    min: 20,
    status: "OK",
    lastMovement: "2026-06-07 17:11",
  },
];

export const movementHistory: Record<string, Movement[]> = {
  "SKU-4821-A": [
    {
      type: "SAÍDA",
      qty: "-3",
      ref: "TXN-00483910",
      by: "vendas@ironledger",
      ts: "2026-06-09 14:32",
    },
    {
      type: "ENTRADA",
      qty: "+5",
      ref: "TXN-00483905",
      by: "estoque-centro@ironledger",
      ts: "2026-06-08 10:15",
    },
    {
      type: "AJUSTE",
      qty: "-1",
      ref: "ADJ-00000821",
      by: "admin@ironledger",
      ts: "2026-06-07 09:00",
    },
  ],
};
