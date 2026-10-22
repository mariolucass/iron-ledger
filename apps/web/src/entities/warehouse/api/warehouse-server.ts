import "server-only";
import { serverRequestJson } from "@/shared/api/server";
import { withQuery } from "@/shared/api/client";
import type { WarehouseQuery, WarehousesPage, WarehousesResponse } from "../model/types";

export const warehouseServerApi = {
  list: () => serverRequestJson<WarehousesResponse>("/warehouses"),
  search: (query: WarehouseQuery = {}) => serverRequestJson<WarehousesPage>(withQuery("/warehouses", query)),
};
