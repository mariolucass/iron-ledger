import { createMetadata } from "@/shared/config/metadata";
import { ProductDetailPage } from "@/views/operations/product-detail";

export const metadata = createMetadata({
  title: "Produto",
  description: "Fotos, estoque e informações do produto.",
});

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailPage productId={id} />;
}
