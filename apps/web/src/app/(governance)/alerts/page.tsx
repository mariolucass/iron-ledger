import type { Metadata } from "next";
import { AlertsPage } from "@/features/(governance)/alerts";

export const metadata: Metadata = {
  title: "Alertas - Iron Ledger",
  description:
    "Central de monitoramento ativo de anomalias e eventos criticos de sistema.",
};

export default function Page() {
  return <AlertsPage />;
}
