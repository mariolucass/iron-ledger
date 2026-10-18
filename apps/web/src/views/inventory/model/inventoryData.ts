import type { InventoryItem as StockItem } from "@/entities/inventory";

/** View model used by the inventory screen. */
export interface InventoryItem extends Pick<StockItem, "stockLevelId" | "sku" | "warehouseId" | "quantity" | "unit" | "available" | "reserved" | "status"> {
  product: string;
  warehouse: string;
  min: number;
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
