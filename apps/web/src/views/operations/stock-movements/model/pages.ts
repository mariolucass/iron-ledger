import type { PlannedPage } from "@/shared/config/planned-page";

/** Razão de movimentações de estoque (inventory.StockMovement). */
export const stockMovementPages = {
  list: {
    title: "Movimentações",
    description: "Razão de entradas, saídas, ajustes, transferências e contagens com saldo anterior e resultante.",
    back: { href: "/inventory", label: "Estoque" },
    action: { href: "/inventory/movements/new", label: "Novo movimento" },
  },
  detail: {
    title: "Movimentação",
    description: "Origem, quantidades, custo, responsável e correlação desta movimentação.",
    back: { href: "/inventory/movements", label: "Movimentações" },
  },
} satisfies Record<string, PlannedPage>;
