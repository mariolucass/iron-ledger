import { createMetadata } from "@/shared/config/metadata";
import { WarehouseLocationPage, warehouseDetailPages } from "@/views/operations/warehouse-detail";

interface PageProps {
  params: Promise<{ id: string; locationId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createMetadata(warehouseDetailPages.location(id));
}

export default async function Page({ params }: PageProps) {
  const { id, locationId } = await params;
  return <WarehouseLocationPage warehouseId={id} locationId={locationId} />;
}
