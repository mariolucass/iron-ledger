import type { AuditAction } from "@/entities/audit-log";

/** Valores de `entityType` gravados pela API → rótulo exibido. */
export const resourceLabels: Record<string, string> = {
  Inventory: "Inventário",
  Transaction: "Transação",
  User: "Usuário",
  Permission: "Permissão",
  System: "Sistema",
};

export const resourceOptions = [
  { value: "", label: "Todos os recursos" },
  ...Object.entries(resourceLabels).map(([value, label]) => ({ value, label })),
];

export interface AuditEntry {
  /** Data e hora já formatadas para exibição. */
  ts: string;
  occurredAt: string;
  user: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  corrId: string;
  eventId: string;
  eventName: string;
  payload: Record<string, unknown>;
}
