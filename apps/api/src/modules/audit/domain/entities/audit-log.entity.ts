export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "PERMISSION_CHANGE";

export type AuditLog = {
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
};

export type NewAuditLog = Omit<AuditLog, "id" | "actorEmail">;
