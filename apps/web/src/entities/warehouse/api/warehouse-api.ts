import { requestJson } from "@/shared/api/client";
import type { WarehousesResponse } from "../model/types";

export const warehouseApi = {
  list: () => requestJson<WarehousesResponse>("/api/warehouses"),
};
