import type { Metadata } from "next";
import { ReportsPage } from "@/views/reports";

export const metadata: Metadata = {
  title: "Relatorios - Iron Ledger",
  description: "Extracao e relatorios de atividades, auditoria e controle de estoques.",
};

export default function Page() {
  return <ReportsPage />;
}
