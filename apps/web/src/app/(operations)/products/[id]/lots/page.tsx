import { createMetadata } from "@/shared/config/metadata";
import { ComingSoonPage } from "@/views/coming-soon";
import { productDetailPages } from "@/views/product-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createMetadata(productDetailPages.lots(id));
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ComingSoonPage {...productDetailPages.lots(id)} />;
}
