import { auditLogApi } from "@/entities/audit-log";
import { withSession } from "@/shared/auth/with-session";
import type { AuditEntry } from "./auditData";

export async function fetchAuditEntries(): Promise<AuditEntry[]> {
  const body = await withSession(auditLogApi.list({ pageSize: 100 }));
  return body.items.map((item) => ({
    ts: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(item.occurredAt)),
    occurredAt: item.occurredAt,
    user: item.actorEmail ?? item.actorId ?? "system",
    action: item.action,
    resource: item.entityType,
    resourceId: item.entityId,
    corrId: item.correlationId ?? "—",
    eventName: item.eventName,
    payload: item.payload,
  }));
}
