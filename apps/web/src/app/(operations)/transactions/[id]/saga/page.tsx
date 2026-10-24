import { createMetadata } from "@/shared/config/metadata";
import { TransactionHistoryPage, transactionHistoryPages } from "@/views/operations/transaction-history";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createMetadata(transactionHistoryPages.saga(id));
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <TransactionHistoryPage id={id} section="saga" />;
}
