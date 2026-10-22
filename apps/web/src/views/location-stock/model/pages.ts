import type { PlannedPage } from "@/shared/config/planned-page";

/** Saldos por endereço do armazém (inventory.LocationStock). */
export const locationStockPages = {
  list: {
    title: "Saldos por localização",
    description: "Quantidades e reservas por endereço do armazém, produto e lote.",
    back: { href: "/inventory", label: "Estoque" },
  },
} satisfies Record<string, PlannedPage>;
