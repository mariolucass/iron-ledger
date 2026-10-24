import type { PlannedPage } from "@/shared/config/planned-page";

/** Fotografias diárias do estoque (analytics.InventorySnapshot). */
export const inventorySnapshotPages = {
  list: {
    title: "Histórico de posições",
    description: "Fotografias diárias de saldo, reservas, entradas, saídas e custo por produto e armazém.",
    back: { href: "/analytics", label: "Analytics" },
  },
} satisfies Record<string, PlannedPage>;
