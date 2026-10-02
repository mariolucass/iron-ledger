import type { AuditEntry } from "../model/auditData";

type AuditResponse = {
  items: Array<{
    eventName: string;
    occurredAt: string;
    actorId: string | null;
    actorEmail: string | null;
    entityType: string;
    entityId: string;
    action: string;
    correlationId: string | null;
    payload: Record<string, unknown>;
  }>;
};

export async function fetchAuditEntries(): Promise<AuditEntry[]> {
  const response = await fetch("/api/audit?pageSize=100", { cache: "no-store" });
  if (response.status === 401) {
    window.location.assign("/login");
    throw new Error("Sessão expirada.");
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "Não foi possível consultar a auditoria.");
  }
  const body = await response.json() as AuditResponse;
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
