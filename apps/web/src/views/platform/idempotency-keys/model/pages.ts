import type { PlannedPage } from "@/shared/config/planned-page";

/** Chaves de idempotência das requisições (platform.IdempotencyKey). */
export const idempotencyKeyPages = {
  list: {
    title: "Chaves de idempotência",
    description: "Requisições deduplicadas, com escopo, situação HTTP e validade.",
    back: { href: "/system", label: "Plataforma" },
  },
} satisfies Record<string, PlannedPage>;
