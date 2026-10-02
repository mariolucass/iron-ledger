import type { Metadata } from "next";
import { TransactionsPage } from "@/features/(operations)/transactions";

export const metadata: Metadata = {
  title: "Transacoes - Iron Ledger",
  description: "Acompanhamento, gestao e liquidacao de transacoes distribuidas baseadas em eventos.",
};

export default function Page() {
  return <TransactionsPage />;
}
