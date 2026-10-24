import type { Route } from "next";
import type { PlannedPage } from "@/shared/config/planned-page";

/** Lotes, números de série e rastreabilidade (inventory.InventoryLot). */
export const inventoryLotPages = {
  list: {
    title: "Lotes e séries",
    description: "Lotes e números de série com situação, fabricação, validade e fornecedor.",
    back: { href: "/inventory", label: "Estoque" },
  },
  detail: (id: string): PlannedPage => ({
    title: "Lote",
    description: "Situação, validade, saldos por localização e reservas do lote.",
    back: { href: "/inventory/lots", label: "Lotes e séries" },
    action: { href: `/inventory/lots/${id}/traceability` as Route, label: "Ver rastreabilidade" },
  }),
  traceability: (id: string): PlannedPage => ({
    title: "Rastreabilidade do lote",
    description: "Caminho do lote do recebimento ao consumo: movimentações, transferências, contagens e reservas.",
    back: { href: `/inventory/lots/${id}` as Route, label: "Lote" },
  }),
} satisfies Record<string, PlannedPage | ((...params: string[]) => PlannedPage)>;
