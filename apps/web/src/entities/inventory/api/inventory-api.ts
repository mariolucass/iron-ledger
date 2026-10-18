import {
  requestJson,
  withQuery,
  type PaginatedResponse,
  type PaginationQuery,
} from "@/shared/api/client";
import type {
  CommitReservationResponse,
  CreateMovementInput,
  CreateReservationInput,
  InventoryItem,
  InventoryQuery,
  StockMovement,
  StockReservation,
} from "../model/types";

export const inventoryApi = {
  list: (query: InventoryQuery = {}) =>
    requestJson<PaginatedResponse<InventoryItem>>(
      withQuery("/api/inventory", query),
    ),
  listMovements: (stockLevelId: string, query: PaginationQuery = {}) =>
    requestJson<PaginatedResponse<StockMovement>>(
      withQuery(
        `/api/inventory/${encodeURIComponent(stockLevelId)}/movements`,
        query,
      ),
    ),
  createMovement: (input: CreateMovementInput) =>
    requestJson<StockMovement>("/api/inventory/movements", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  createReservation: (input: CreateReservationInput) =>
    requestJson<StockReservation>("/api/inventory/reservations", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  releaseReservation: (id: string) =>
    requestJson<StockReservation>(
      `/api/inventory/reservations/${encodeURIComponent(id)}/release`,
      {
        method: "POST",
      },
    ),
  commitReservation: (id: string) =>
    requestJson<CommitReservationResponse>(
      `/api/inventory/reservations/${encodeURIComponent(id)}/commit`,
      {
        method: "POST",
      },
    ),
};
