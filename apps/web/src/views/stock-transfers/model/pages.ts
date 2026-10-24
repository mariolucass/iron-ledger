import type { Route } from "next";
import type { PlannedPage } from "@/shared/config/planned-page";

/** Transferências entre armazéns (inventory.StockTransfer, StockTransferItem). */
export const stockTransferPages = {
  list: {
    title: "Transferências",
    description: "Transferências entre armazéns, da solicitação ao recebimento.",
    back: { href: "/inventory", label: "Estoque" },
    action: { href: "/inventory/transfers/new", label: "Nova transferência" },
  },
  create: {
    title: "Nova transferência",
    description: "Escolha origem, destino, itens e lotes a transferir.",
    back: { href: "/inventory/transfers", label: "Transferências" },
  },
  detail: (id: string): PlannedPage => ({
    title: "Transferência",
    description: "Itens solicitados, expedidos e recebidos, transporte e aprovações.",
    back: { href: "/inventory/transfers", label: "Transferências" },
    action: { href: `/inventory/transfers/${id}/receive` as Route, label: "Registrar recebimento" },
  }),
  edit: (id: string): PlannedPage => ({
    title: "Editar transferência",
    description: "Ajuste itens, destino e transporte enquanto a transferência não foi expedida.",
    back: { href: `/inventory/transfers/${id}` as Route, label: "Transferência" },
  }),
  receive: (id: string): PlannedPage => ({
    title: "Recebimento da transferência",
    description: "Confira as quantidades recebidas por item e lote no armazém de destino.",
    back: { href: `/inventory/transfers/${id}` as Route, label: "Transferência" },
  }),
} satisfies Record<string, PlannedPage | ((...params: string[]) => PlannedPage)>;
