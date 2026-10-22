import type { PlannedPage } from "@/shared/config/planned-page";

/** Auditoria das ações de usuários (audit.AuditLog por ator). */
export const userAuditLogPages = {
  list: {
    title: "Auditoria de usuários",
    description: "Ações realizadas por usuários e seus recursos afetados.",
    back: { href: "/users", label: "Usuários" },
  },
} satisfies Record<string, PlannedPage>;
