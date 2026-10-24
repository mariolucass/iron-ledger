import type { PlannedPage } from "@/shared/config/planned-page";

/** Detalhe de um alerta disparado (analytics.Alert). */
export const alertDetailPages = {
  detail: {
    title: "Alerta",
    description: "Ocorrências, contexto e ciclo de reconhecimento e resolução do alerta.",
    back: { href: "/alerts", label: "Alertas" },
  },
} satisfies Record<string, PlannedPage>;
