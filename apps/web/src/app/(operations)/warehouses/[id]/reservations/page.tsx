import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { warehouseDetailPages } from "@/views/warehouse-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createMetadata(warehouseDetailPages.reservations(id));
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ComingSoonPage {...warehouseDetailPages.reservations(id)} />;
}
