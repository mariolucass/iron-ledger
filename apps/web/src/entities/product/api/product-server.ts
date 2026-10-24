import "server-only";
import { serverRequestJson } from "@/shared/api/server";
import { withQuery, type PaginatedResponse } from "@/shared/api/client";
import type { ProductLookups, ProductQuery, ProductSummary } from "../model/types";

export const productServerApi = {
  list: (query: ProductQuery = {}) => serverRequestJson<PaginatedResponse<ProductSummary>>(withQuery("/products", query)),
  lookups: () => serverRequestJson<ProductLookups>("/products/lookups"),
};
