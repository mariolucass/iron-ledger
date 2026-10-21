import { createMetadata } from "@/shared/config/metadata";
import { TransactionDetailPage } from "@/views/transaction-detail";

export const metadata = createMetadata({
  title: "Detalhes da transação",
  description: "Detalhamento de transação distribuída, fluxo de eventos e compensações.",
});

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <TransactionDetailPage id={id} />;
}
