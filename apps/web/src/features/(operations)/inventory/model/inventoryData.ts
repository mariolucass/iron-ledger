export interface InventoryItem {
  stockLevelId?: string;
  sku: string;
  product: string;
  warehouse: string;
  warehouseId: string;
  quantity: number;
  unit?: string;
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

export const movementHistory: Record<string, Movement[]> = {
};
