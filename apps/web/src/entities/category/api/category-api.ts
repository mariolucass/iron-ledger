import { requestJson, withQuery, type PaginatedResponse } from "@/shared/api/client";
import type { Category, CategoryQuery, CreateCategoryInput } from "../model/types";
export const categoryApi = {
  list: (query: CategoryQuery = {}) =>
    requestJson<PaginatedResponse<Category>>(withQuery("/api/categories", query)),
  create: (input: CreateCategoryInput) =>
    requestJson<Category>("/api/categories", { method: "POST", body: JSON.stringify(input) }),
};
