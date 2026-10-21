import type { PaginationQuery } from "@/shared/api/client";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "PERMISSION_CHANGE";

export interface AuditLog {
  id: string;
  eventId: string;
  eventName: string;
  occurredAt: string;
  actorId: string | null;
  actorEmail: string | null;
  entityType: string;
  entityId: string;
  action: AuditAction;
  correlationId: string | null;
  payload: Record<string, unknown>;
}

export interface AuditQuery extends PaginationQuery {
  eventName?: string;
  entityType?: string;
  entityId?: string;
  actor?: string;
  action?: AuditAction;
  correlationId?: string;
  from?: string;
  to?: string;
}
