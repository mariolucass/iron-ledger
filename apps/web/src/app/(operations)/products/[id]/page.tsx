import { createMetadata } from "@/shared/config/metadata";
import { ProductEditorPage } from "@/views/product-editor";

export const metadata = createMetadata({
  title: "Produto",
  description: "Detalhes e edição do produto.",
});

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEditorPage productId={id} />;
}
