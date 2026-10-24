import type { PlannedPage } from "@/shared/config/planned-page";

/** Detalhe de um evento de auditoria (audit.AuditLog, AuditLogChange). */
export const auditEntryPages = {
  detail: {
    title: "Evento de auditoria",
    description: "Ator, origem, correlação, payload e campos alterados neste evento.",
    back: { href: "/audit-log", label: "Log de Auditoria" },
  },
} satisfies Record<string, PlannedPage>;
