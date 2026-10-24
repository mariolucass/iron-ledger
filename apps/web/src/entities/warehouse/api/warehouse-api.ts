import { requestJson, withQuery, type PaginatedResponse } from "@/shared/api/client";
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
  WarehouseInventoryRow,
  WarehouseMovementRow,
  WarehouseReservationRow,
  WarehouseTransferRow,
  WarehouseCountRow,
  WarehouseAccessRow,
  WarehouseSettingRow,
  WarehouseLocationDetail,
} from "../model/types";

const json = (body: unknown) => JSON.stringify(body);
const base = (id: string) => `/api/warehouses/${encodeURIComponent(id)}`;

export const warehouseApi = {
  /** Active warehouses only (default); used by filters in other screens. */
  list: () => requestJson<WarehousesResponse>("/api/warehouses"),
  search: (query: WarehouseQuery = {}) =>
    requestJson<WarehousesPage>(withQuery("/api/warehouses", query)),
  get: (id: string) => requestJson<WarehouseDetail>(base(id)),
  inventory: (id: string, page = 1) =>
    requestJson<PaginatedResponse<WarehouseInventoryRow>>(
      withQuery(`${base(id)}/inventory`, { page, pageSize: 20 }),
    ),
  movements: (id: string, page = 1) =>
    requestJson<PaginatedResponse<WarehouseMovementRow>>(
      withQuery(`${base(id)}/movements`, { page, pageSize: 20 }),
    ),
  reservations: (id: string, page = 1) =>
    requestJson<PaginatedResponse<WarehouseReservationRow>>(
      withQuery(`${base(id)}/reservations`, { page, pageSize: 20 }),
    ),
  transfers: (id: string, page = 1) =>
    requestJson<PaginatedResponse<WarehouseTransferRow>>(
      withQuery(`${base(id)}/transfers`, { page, pageSize: 20 }),
    ),
  counts: (id: string, page = 1) =>
    requestJson<PaginatedResponse<WarehouseCountRow>>(
      withQuery(`${base(id)}/counts`, { page, pageSize: 20 }),
    ),
  access: (id: string) => requestJson<WarehouseAccessRow[]>(`${base(id)}/access`),
  settings: (id: string) => requestJson<WarehouseSettingRow[]>(`${base(id)}/settings`),
  location: (id: string, locationId: string) =>
    requestJson<WarehouseLocationDetail>(`${base(id)}/locations/${encodeURIComponent(locationId)}`),
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
