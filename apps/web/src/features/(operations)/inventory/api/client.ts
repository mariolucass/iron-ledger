import type { InventoryItem, Movement } from "../model/inventoryData";

type InventoryResponse = {
  items: Array<{
    stockLevelId: string;
    sku: string;
    productName: string;
    warehouseName: string;
    available: number;
    reserved: number;
    minStock: number;
    status: InventoryItem["status"];
    updatedAt: string;
  }>;
};

type MovementResponse = {
  items: Array<{
    type: string;
    quantity: number;
    referenceId: string | null;
    performedBy: string;
    createdAt: string;
  }>;
};

async function checkedFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, { ...init, cache: "no-store" });
  if (response.status === 401) {
    window.location.assign("/login");
    throw new Error("Sessão expirada.");
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "Não foi possível consultar a API.");
  }
  return response;
}

const dateTime = (value: string) => new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
}).format(new Date(value));

export async function fetchInventory(): Promise<InventoryItem[]> {
  const response = await checkedFetch("/api/inventory?pageSize=100");
  const body = await response.json() as InventoryResponse;
  return body.items.map((item) => ({
    stockLevelId: item.stockLevelId,
    sku: item.sku,
    product: item.productName,
    warehouse: item.warehouseName,
    available: item.available,
    reserved: item.reserved,
    min: item.minStock,
    status: item.status,
    lastMovement: dateTime(item.updatedAt),
  }));
}

export async function fetchWarehouses(): Promise<string[]> {
  const response = await checkedFetch("/api/warehouses");
  const body = await response.json() as { items: Array<{ name: string }> };
  return ["Todos os estoques", ...body.items.map((item) => item.name)];
}

export async function fetchMovements(stockLevelId: string): Promise<Movement[]> {
  const response = await checkedFetch(`/api/inventory/${encodeURIComponent(stockLevelId)}/movements?pageSize=5`);
  const body = await response.json() as MovementResponse;
  return body.items.map((item) => {
    const outbound = item.type === "OUTBOUND";
    const type: Movement["type"] = item.type === "INBOUND" || item.type === "RETURN"
      ? "ENTRADA"
      : outbound
        ? "SAÍDA"
        : "AJUSTE";
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

export async function createMovement(input: {
  stockLevelId: string;
  type: "INBOUND" | "OUTBOUND" | "ADJUSTMENT" | "RETURN";
  quantity: number;
  referenceId?: string;
  notes?: string;
}) {
  await checkedFetch("/api/inventory/movements", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}
