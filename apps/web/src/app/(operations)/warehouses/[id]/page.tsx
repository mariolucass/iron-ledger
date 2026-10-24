import { createMetadata } from "@/shared/config/metadata";
import { WarehouseOverviewPage, warehouseDetailPages } from "@/views/operations/warehouse-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createMetadata(warehouseDetailPages.overview(id));
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <WarehouseOverviewPage warehouseId={id} />;
}
