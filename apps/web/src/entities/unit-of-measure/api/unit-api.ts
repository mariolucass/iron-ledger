import { requestJson, withQuery, type PaginatedResponse } from "@/shared/api/client";
import type { CreateUnitInput, UnitOfMeasure, UnitQuery } from "../model/types";
export const unitApi = {
  list: (query: UnitQuery = {}) =>
    requestJson<PaginatedResponse<UnitOfMeasure>>(withQuery("/api/units-of-measure", query)),
  create: (input: CreateUnitInput) =>
    requestJson<UnitOfMeasure>("/api/units-of-measure", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
