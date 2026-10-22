import "server-only";
import { serverRequestJson } from "@/shared/api/server";
import { withQuery, type PaginatedResponse } from "@/shared/api/client";
import type { RoleSummary, UserQuery, UserSummary } from "../model/types";

export const userServerApi = {
  list: (query: UserQuery = {}) => serverRequestJson<PaginatedResponse<UserSummary>>(withQuery("/users", query)),
  listRoles: () => serverRequestJson<{ items: RoleSummary[] }>("/roles"),
};
