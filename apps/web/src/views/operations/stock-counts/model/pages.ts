import type { Route } from "next";
import type { PlannedPage } from "@/shared/config/planned-page";

/** Contagens de inventário (inventory.StockCount, StockCountItem). */
export const stockCountPages = {
  list: {
    title: "Contagens",
    description: "Inventários completos, cíclicos e pontuais, do planejamento ao lançamento.",
    back: { href: "/inventory", label: "Estoque" },
    action: { href: "/inventory/counts/new", label: "Nova contagem" },
  },
  create: {
    title: "Nova contagem",
    description: "Defina armazém, tipo, agendamento e se a contagem será às cegas.",
    back: { href: "/inventory/counts", label: "Contagens" },
  },
  detail: (id: string): PlannedPage => ({
    title: "Contagem",
    description: "Andamento, itens contados, divergências e aprovação da contagem.",
    back: { href: "/inventory/counts", label: "Contagens" },
    action: { href: `/inventory/counts/${id}/count` as Route, label: "Apontar contagem" },
  }),
  count: (id: string): PlannedPage => ({
    title: "Apontamento da contagem",
    description: "Registre as quantidades contadas por localização, produto e lote.",
    back: { href: `/inventory/counts/${id}` as Route, label: "Contagem" },
  }),
  review: (id: string): PlannedPage => ({
    title: "Revisão da contagem",
    description: "Analise divergências, solicite recontagens e aprove o lançamento dos ajustes.",
    back: { href: `/inventory/counts/${id}` as Route, label: "Contagem" },
  }),
} satisfies Record<string, PlannedPage | ((...params: string[]) => PlannedPage)>;
