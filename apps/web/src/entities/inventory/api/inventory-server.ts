import "server-only";
import { serverRequestJson } from "@/shared/api/server";
import { withQuery, type PaginatedResponse } from "@/shared/api/client";
import type { InventoryItem, InventoryQuery } from "../model/types";

export const inventoryServerApi = {
  list: (query: InventoryQuery = {}) => serverRequestJson<PaginatedResponse<InventoryItem>>(withQuery("/inventory", query)),
};
