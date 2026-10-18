import {
  requestJson,
  withQuery,
  type PaginatedResponse,
} from "@/shared/api/client";
import type { AuditLog, AuditQuery } from "../model/types";

export const auditLogApi = {
  list: (query: AuditQuery = {}) =>
    requestJson<PaginatedResponse<AuditLog>>(withQuery("/api/audit", query)),
};
