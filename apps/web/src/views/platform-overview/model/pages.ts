import type { PlannedPage } from "@/shared/config/planned-page";

/** Saúde da mensageria e dos processos da plataforma. */
export const platformOverviewPages = {
  overview: {
    title: "Plataforma",
    description: "Saúde da mensageria, filas de eventos, falhas e configurações do sistema.",
  },
} satisfies Record<string, PlannedPage>;
