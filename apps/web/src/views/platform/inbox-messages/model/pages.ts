import type { PlannedPage } from "@/shared/config/planned-page";

/** Mensagens consumidas (platform.InboxMessage). */
export const inboxMessagePages = {
  list: {
    title: "Mensagens recebidas",
    description: "Mensagens processadas por consumidor, com falhas e tentativas.",
    back: { href: "/system", label: "Plataforma" },
  },
} satisfies Record<string, PlannedPage>;
