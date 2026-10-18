import { inventoryApi } from "@/entities/inventory";
import { transactionApi, type TransactionQuery } from "@/entities/transaction";
import type { TransactionStockOption } from "@/features/start-transaction";
import { withSession } from "@/shared/auth/with-session";

export const PAGE_SIZE = 20;

export function fetchTransactions(query: TransactionQuery) {
  return withSession(transactionApi.list({ pageSize: PAGE_SIZE, ...query }));
}

export async function fetchStockOptions(): Promise<TransactionStockOption[]> {
  const body = await withSession(inventoryApi.list({ pageSize: 100 }));
  return body.items.map((item) => ({
    stockLevelId: item.stockLevelId,
    sku: item.sku,
    product: item.productName,
    warehouse: item.warehouseName,
    available: item.available,
  }));
}

/** `yyyy-mm-dd` do seletor → limites ISO do dia no fuso local. */
export function dayRange(from: string, to: string): Pick<TransactionQuery, "from" | "to"> {
  return {
    from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
  };
}

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value));
