import type { PlannedPage } from "@/shared/config/planned-page";

/** Verificação da cadeia de hashes da auditoria (audit.AuditLog.hash, previousHash). */
export const auditIntegrityPages = {
  overview: {
    title: "Integridade da cadeia",
    description: "Verificação da sequência e dos hashes encadeados do log de auditoria.",
    back: { href: "/audit-log", label: "Log de Auditoria" },
  },
} satisfies Record<string, PlannedPage>;
