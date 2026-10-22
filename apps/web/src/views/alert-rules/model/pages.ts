import type { Route } from "next";
import type { PlannedPage } from "@/shared/config/planned-page";

/** Regras de alerta e seus assinantes (analytics.AlertRule, AlertRuleSubscriber). */
export const alertRulePages = {
  list: {
    title: "Regras de alerta",
    description: "Condições que disparam alertas de estoque, validade, reservas, sagas e divergências de contagem.",
    back: { href: "/alerts", label: "Alertas" },
    action: { href: "/alerts/rules/new", label: "Nova regra" },
  },
  create: {
    title: "Nova regra de alerta",
    description: "Defina tipo, severidade, escopo por produto ou armazém, condição e intervalo de silêncio.",
    back: { href: "/alerts/rules", label: "Regras" },
  },
  detail: (id: string): PlannedPage => ({
    title: "Regra de alerta",
    description: "Condição, escopo, assinantes e alertas disparados por esta regra.",
    back: { href: "/alerts/rules", label: "Regras" },
    action: { href: `/alerts/rules/${id}/edit` as Route, label: "Editar regra" },
  }),
  edit: (id: string): PlannedPage => ({
    title: "Editar regra de alerta",
    description: "Ajuste condição, severidade, escopo e intervalo de silêncio da regra.",
    back: { href: `/alerts/rules/${id}` as Route, label: "Regra" },
  }),
  subscribers: (id: string): PlannedPage => ({
    title: "Assinantes da regra",
    description: "Usuários notificados por esta regra, com canal e severidade mínima de cada um.",
    back: { href: `/alerts/rules/${id}` as Route, label: "Regra" },
  }),
} satisfies Record<string, PlannedPage | ((...params: string[]) => PlannedPage)>;
