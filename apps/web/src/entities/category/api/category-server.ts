import "server-only";
import { serverRequestJson } from "@/shared/api/server";
import { withQuery, type PaginatedResponse } from "@/shared/api/client";
import type { Category, CategoryQuery } from "../model/types";
export const categoryServerApi = {
  list: (query: CategoryQuery = {}) =>
    serverRequestJson<PaginatedResponse<Category>>(withQuery("/categories", query)),
};
