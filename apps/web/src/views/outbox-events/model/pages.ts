import type { PlannedPage } from "@/shared/config/planned-page";

/** Eventos do outbox transacional (platform.OutboxEvent). */
export const outboxEventPages = {
  list: {
    title: "Eventos publicados",
    description: "Eventos pendentes, publicados, com falha e em dead letter, com tentativas e último erro.",
    back: { href: "/system", label: "Plataforma" },
  },
  detail: {
    title: "Evento do outbox",
    description: "Agregado, roteamento, payload, cabeçalhos e tentativas de publicação.",
    back: { href: "/system/outbox", label: "Eventos publicados" },
  },
} satisfies Record<string, PlannedPage>;
