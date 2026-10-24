import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { stockTransferPages } from "@/views/stock-transfers";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createMetadata(stockTransferPages.edit(id));
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ComingSoonPage {...stockTransferPages.edit(id)} />;
}
