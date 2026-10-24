import "server-only";
import { serverRequestJson } from "@/shared/api/server";
import { withQuery, type PaginatedResponse } from "@/shared/api/client";
import type { UnitOfMeasure, UnitQuery } from "../model/types";
export const unitServerApi = {
  list: (query: UnitQuery = {}) =>
    serverRequestJson<PaginatedResponse<UnitOfMeasure>>(withQuery("/units-of-measure", query)),
};
