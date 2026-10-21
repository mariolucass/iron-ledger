import { requestJson, withQuery } from "@/shared/api/client";
import type {
  CreateLocationInput,
  CreateWarehouseInput,
  UpdateLocationInput,
  WarehouseDetail,
  WarehouseInput,
  WarehouseLocation,
  WarehouseQuery,
  WarehousesPage,
  WarehousesResponse,
} from "../model/types";

const json = (body: unknown) => JSON.stringify(body);
const base = (id: string) => `/api/warehouses/${encodeURIComponent(id)}`;

export const warehouseApi = {
  /** Active warehouses only (default); used by filters in other screens. */
  list: () => requestJson<WarehousesResponse>("/api/warehouses"),
  search: (query: WarehouseQuery = {}) => requestJson<WarehousesPage>(withQuery("/api/warehouses", query)),
  get: (id: string) => requestJson<WarehouseDetail>(base(id)),
  create: (input: CreateWarehouseInput) =>
    requestJson<WarehouseDetail>("/api/warehouses", { method: "POST", body: json(input) }),
  update: (id: string, input: Partial<WarehouseInput>) =>
    requestJson<WarehouseDetail>(base(id), { method: "PATCH", body: json(input) }),
  deactivate: (id: string) => requestJson<WarehouseDetail>(base(id), { method: "DELETE" }),
  createLocation: (id: string, input: CreateLocationInput) =>
    requestJson<WarehouseLocation>(`${base(id)}/locations`, { method: "POST", body: json(input) }),
  updateLocation: (id: string, locationId: string, input: UpdateLocationInput) =>
    requestJson<WarehouseLocation>(`${base(id)}/locations/${encodeURIComponent(locationId)}`, {
      method: "PATCH",
      body: json(input),
    }),
};
