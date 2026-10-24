import type { InventoryItem } from "@/entities/inventory";

/** The page supplies labels, without making the action depend on its view model. */
export interface MovementStockOption extends Pick<InventoryItem, "stockLevelId" | "sku"> {
  product: string;
  warehouse: string;
}
