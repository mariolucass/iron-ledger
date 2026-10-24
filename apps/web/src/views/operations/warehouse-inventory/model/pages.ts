import type { PlannedPage } from "@/shared/config/planned-page";

/** Comparativo de saldos entre armazéns (inventory.StockLevel). */
export const warehouseInventoryPages = {
  overview: {
    title: "Estoque por armazém",
    description: "Visão comparativa dos saldos e reservas por armazém.",
    back: { href: "/warehouses", label: "Armazéns" },
  },
} satisfies Record<string, PlannedPage>;
