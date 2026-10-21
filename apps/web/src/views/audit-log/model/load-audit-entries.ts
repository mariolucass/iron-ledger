import { auditLogApi, type AuditQuery } from "@/entities/audit-log";
import { withSession } from "@/shared/auth/with-session";
import type { AuditEntry } from "./auditData";

export const PAGE_SIZE = 20;

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" });

export async function fetchAuditPage(query: AuditQuery): Promise<{ items: AuditEntry[]; total: number }> {
  const body = await withSession(auditLogApi.list({ pageSize: PAGE_SIZE, ...query }));
  return {
    total: body.total,
    items: body.items.map((item) => ({
      ts: dateTime.format(new Date(item.occurredAt)),
      occurredAt: item.occurredAt,
      user: item.actorEmail ?? item.actorId ?? "Sistema",
      action: item.action,
      resource: item.entityType,
      resourceId: item.entityId,
      corrId: item.correlationId ?? "—",
      eventId: item.eventId,
      eventName: item.eventName,
      payload: item.payload,
    })),
  };
}
