import type { Metadata } from "next";
import { InventoryPage } from "@/views/inventory";

export const metadata: Metadata = {
  title: "Estoque - Iron Ledger",
  description:
    "Controle de inventario multi-warehouse em tempo real com orquestracao automatica.",
};

export default function Page() {
  return <InventoryPage />;
}
