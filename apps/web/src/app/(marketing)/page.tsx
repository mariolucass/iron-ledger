import type { Metadata } from "next";
import { LandingPage } from "@/features/(marketing)/landing";

export const metadata: Metadata = {
  title: "Iron Ledger - O Sistema Operacional Financeiro",
  description: "Controle financeiro redefinido com auditoria imutavel, transacoes distribuidas e previsao com IA.",
};

export default function Page() {
  return <LandingPage />;
}
