import { inventoryApi } from "@/entities/inventory";
import { transactionApi, type TransactionQuery } from "@/entities/transaction";
import type { TransactionStockOption } from "@/features/operations/start-transaction";
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

export { dayRange } from "@/shared/lib/day-range";

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value));
