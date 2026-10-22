import { inventoryApi, type InventoryQuery } from "@/entities/inventory";
import { warehouseApi } from "@/entities/warehouse";
import { withSession } from "@/shared/auth/with-session";
import type { InventoryItem, Movement } from "./inventoryData";
import { presentInventoryPage } from "./present-inventory";

const dateTime = (value: string) => new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short", timeStyle: "short",
}).format(new Date(value));

export { PAGE_SIZE } from "./pagination";
import { PAGE_SIZE } from "./pagination";

/** Page-specific presentation; entity clients keep the original API contract. */
export async function fetchInventoryPage(query: InventoryQuery): Promise<{ items: InventoryItem[]; total: number }> {
  return presentInventoryPage(await withSession(inventoryApi.list({ pageSize: PAGE_SIZE, ...query })));
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

/** Opções do diálogo "Novo movimento": todos os saldos (até 100), sem depender da página aberta. */
export async function fetchMovementOptions(): Promise<InventoryItem[]> {
  return (await fetchInventoryPage({ pageSize: 100 })).items;
}
