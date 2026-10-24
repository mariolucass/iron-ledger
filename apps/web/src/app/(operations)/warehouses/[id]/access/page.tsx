import { createMetadata } from "@/shared/config/metadata";
import { WarehouseSectionPage, warehouseDetailPages } from "@/views/operations/warehouse-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createMetadata(warehouseDetailPages.access(id));
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <WarehouseSectionPage warehouseId={id} section="access" />;
}
