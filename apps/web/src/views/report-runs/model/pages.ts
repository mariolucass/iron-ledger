import type { PlannedPage } from "@/shared/config/planned-page";

/** Execuções e arquivos gerados de relatórios (analytics.ReportRun). */
export const reportRunPages = {
  list: {
    title: "Execuções de relatório",
    description: "Relatórios solicitados e agendados, com situação, tamanho e validade do arquivo.",
    back: { href: "/reports", label: "Relatórios" },
  },
  detail: {
    title: "Execução de relatório",
    description: "Parâmetros, duração, linhas geradas e download do arquivo.",
    back: { href: "/reports/runs", label: "Execuções" },
  },
} satisfies Record<string, PlannedPage>;
