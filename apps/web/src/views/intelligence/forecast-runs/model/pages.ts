import type { PlannedPage } from "@/shared/config/planned-page";

/** Execuções do modelo de previsão (analytics.ForecastRun, DemandForecast). */
export const forecastRunPages = {
  list: {
    title: "Execuções do modelo",
    description: "Treinamentos e previsões geradas, com modelo, granularidade, horizonte e métricas.",
    back: { href: "/forecasting", label: "Previsões" },
    action: { href: "/forecasting/runs/new", label: "Nova execução" },
  },
  create: {
    title: "Nova execução",
    description: "Escolha modelo, granularidade, horizonte e período de treino.",
    back: { href: "/forecasting/runs", label: "Execuções" },
  },
  detail: {
    title: "Execução do modelo",
    description: "Parâmetros, métricas, erros e previsões geradas nesta execução.",
    back: { href: "/forecasting/runs", label: "Execuções" },
  },
} satisfies Record<string, PlannedPage>;
