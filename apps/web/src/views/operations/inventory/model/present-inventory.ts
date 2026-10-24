import type { InventoryItem as ApiInventoryItem } from "@/entities/inventory";
import type { InventoryItem } from "./inventoryData";

const dateTime = (value: string) => new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short", timeStyle: "short",
}).format(new Date(value));

export function presentInventoryPage(body: { items: ApiInventoryItem[]; total: number }): { items: InventoryItem[]; total: number } {
  const items = body.items.map((item): InventoryItem => ({
    stockLevelId: item.stockLevelId,
    sku: item.sku,
    product: item.productName,
    warehouse: item.warehouseName,
    warehouseId: item.warehouseId,
    quantity: item.quantity,
    unit: item.unit,
    available: item.available,
    reserved: item.reserved,
    min: item.minStock,
    status: item.status,
    lastMovement: dateTime(item.updatedAt),
  }));
  return { items, total: body.total };
}
