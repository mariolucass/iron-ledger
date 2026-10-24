import type { Route } from "next";
import type { PlannedPage } from "@/shared/config/planned-page";

/** Definições de relatório e agendamentos (analytics.ReportDefinition). */
export const reportDefinitionPages = {
  list: {
    title: "Definições de relatório",
    description: "Relatórios disponíveis, com parâmetros, agendamento e formato de saída.",
    back: { href: "/reports", label: "Relatórios" },
    action: { href: "/reports/definitions/new", label: "Nova definição" },
  },
  create: {
    title: "Nova definição de relatório",
    description: "Defina parâmetros, agendamento e formato CSV, XLSX, PDF ou JSON.",
    back: { href: "/reports/definitions", label: "Definições" },
  },
  detail: (id: string): PlannedPage => ({
    title: "Definição de relatório",
    description: "Parâmetros, agendamento e execuções desta definição.",
    back: { href: "/reports/definitions", label: "Definições" },
    action: { href: `/reports/definitions/${id}/edit` as Route, label: "Editar definição" },
  }),
  edit: (id: string): PlannedPage => ({
    title: "Editar definição de relatório",
    description: "Ajuste parâmetros, agendamento, formato e situação da definição.",
    back: { href: `/reports/definitions/${id}` as Route, label: "Definição" },
  }),
} satisfies Record<string, PlannedPage | ((...params: string[]) => PlannedPage)>;
