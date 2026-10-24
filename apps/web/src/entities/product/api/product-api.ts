import { requestJson, withQuery, type PaginatedResponse } from "@/shared/api/client";
import type { CreateProductInput, ProductImportReport, ProductImportRequest, Product, ProductForecast, ProductInput, ProductInventoryRow, ProductLookups, ProductLotRow, ProductMovementRow, ProductQuery, ProductSummary, ProductUnitRow } from "../model/types";

const json = (body: unknown) => JSON.stringify(body);

export const productApi = {
  list: (query: ProductQuery = {}) =>
    requestJson<PaginatedResponse<ProductSummary>>(withQuery("/api/products", query)),
  get: (id: string) => requestJson<Product>(`/api/products/${encodeURIComponent(id)}`),
  inventory: (id: string) => requestJson<ProductInventoryRow[]>(`/api/products/${encodeURIComponent(id)}/inventory`),
  movements: (id: string, page = 1, pageSize = 20) =>
    requestJson<PaginatedResponse<ProductMovementRow>>(withQuery(`/api/products/${encodeURIComponent(id)}/movements`, { page, pageSize })),
  lots: (id: string, page = 1, pageSize = 20) =>
    requestJson<PaginatedResponse<ProductLotRow>>(withQuery(`/api/products/${encodeURIComponent(id)}/lots`, { page, pageSize })),
  units: (id: string) => requestJson<ProductUnitRow[]>(`/api/products/${encodeURIComponent(id)}/units`),
  forecast: (id: string) => requestJson<ProductForecast>(`/api/products/${encodeURIComponent(id)}/forecast`),
  lookups: () => requestJson<ProductLookups>("/api/products/lookups"),
  create: (input: CreateProductInput) =>
    requestJson<Product>("/api/products", { method: "POST", body: json(input) }),
  update: (id: string, input: Partial<ProductInput>) =>
    requestJson<Product>(`/api/products/${encodeURIComponent(id)}`, { method: "PATCH", body: json(input) }),
  previewImport: (input: ProductImportRequest) =>
    requestJson<ProductImportReport>("/api/products/imports/preview", { method: "POST", body: json(input) }),
  commitImport: (input: ProductImportRequest) =>
    requestJson<ProductImportReport>("/api/products/imports/commit", { method: "POST", body: json(input) }),
  archive: (id: string) =>
    requestJson<Product>(`/api/products/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
