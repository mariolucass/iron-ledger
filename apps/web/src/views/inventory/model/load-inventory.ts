import { inventoryApi } from "@/entities/inventory";
import { warehouseApi } from "@/entities/warehouse";
import { withSession } from "@/shared/auth/with-session";
import type { InventoryItem, Movement } from "./inventoryData";

const dateTime = (value: string) => new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short", timeStyle: "short",
}).format(new Date(value));

/** Page-specific presentation; entity clients keep the original API contract. */
export async function fetchInventory(): Promise<InventoryItem[]> {
  const body = await withSession(inventoryApi.list({ pageSize: 100 }));
  return body.items.map((item) => ({
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
}

export async function fetchWarehouses() {
  const body = await withSession(warehouseApi.list());
  return [{ id: "all", name: "Todos os estoques" }, ...body.items.map(({ id, name }) => ({ id, name }))];
}

export async function fetchMovements(stockLevelId: string): Promise<Movement[]> {
  const body = await withSession(inventoryApi.listMovements(stockLevelId, { pageSize: 5 }));
  return body.items.map((item) => {
    const outbound = item.type === "OUTBOUND";
    const type: Movement["type"] = item.type === "INBOUND" || item.type === "RETURN"
      ? "ENTRADA" : outbound ? "SAÍDA" : "AJUSTE";
    const signedQuantity = outbound ? -Math.abs(item.quantity) : item.quantity;
    return {
      type,
      qty: `${signedQuantity > 0 ? "+" : ""}${signedQuantity}`,
      ref: item.referenceId ?? "—",
      by: item.performedBy,
      ts: dateTime(item.createdAt),
    };
  });
}

