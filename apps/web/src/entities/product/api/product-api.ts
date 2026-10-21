import { requestJson, withQuery, type PaginatedResponse } from "@/shared/api/client";
import type { CreateProductInput, Product, ProductInput, ProductLookups, ProductQuery, ProductSummary } from "../model/types";

const json = (body: unknown) => JSON.stringify(body);

export const productApi = {
  list: (query: ProductQuery = {}) =>
    requestJson<PaginatedResponse<ProductSummary>>(withQuery("/api/products", query)),
  get: (id: string) => requestJson<Product>(`/api/products/${encodeURIComponent(id)}`),
  lookups: () => requestJson<ProductLookups>("/api/products/lookups"),
  create: (input: CreateProductInput) =>
    requestJson<Product>("/api/products", { method: "POST", body: json(input) }),
  update: (id: string, input: Partial<ProductInput>) =>
    requestJson<Product>(`/api/products/${encodeURIComponent(id)}`, { method: "PATCH", body: json(input) }),
  archive: (id: string) =>
    requestJson<Product>(`/api/products/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
