import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { warehouseDetailPages } from "@/views/warehouse-detail";

interface PageProps {
  params: Promise<{ id: string; locationId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createMetadata(warehouseDetailPages.location(id));
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ComingSoonPage {...warehouseDetailPages.location(id)} />;
}
