import type { Metadata } from "next";
import { TransactionDetailPage } from "@/views/transaction-detail";

export const metadata: Metadata = {
  title: "Detalhes da Transacao - Iron Ledger",
  description:
    "Detalhamento de transacao distribuida, fluxo de eventos e compensacoes.",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <TransactionDetailPage id={id} />;
}
