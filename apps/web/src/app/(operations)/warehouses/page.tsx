import type { Metadata } from "next";
import { WarehousesPage } from "@/views/warehouses";

export const metadata: Metadata = {
  title: "Armazens - Iron Ledger",
  description: "Controle e monitoramento de instalacoes, armazens e zonas de armazenamento.",
};

export default function Page() {
  return <WarehousesPage />;
}
