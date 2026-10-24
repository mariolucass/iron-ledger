import type { PlannedPage } from "@/shared/config/planned-page";

/** Reservas de estoque (inventory.StockReservation). */
export const stockReservationPages = {
  list: {
    title: "Reservas",
    description: "Reservas ativas, confirmadas, liberadas e expiradas por produto, armazém e transação.",
    back: { href: "/inventory", label: "Estoque" },
  },
  detail: {
    title: "Reserva",
    description: "Quantidade, validade, transação de origem e movimentações geradas pela reserva.",
    back: { href: "/inventory/reservations", label: "Reservas" },
  },
} satisfies Record<string, PlannedPage>;
