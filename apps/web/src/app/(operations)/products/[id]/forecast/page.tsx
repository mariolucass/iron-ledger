import { createMetadata } from "@/shared/config/metadata";
import { ProductSectionPage, productDetailPages } from "@/views/operations/product-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createMetadata(productDetailPages.forecast(id));
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ProductSectionPage productId={id} section="forecast" />;
}
