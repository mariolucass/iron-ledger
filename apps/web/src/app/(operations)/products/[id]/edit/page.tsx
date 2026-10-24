import { createMetadata } from "@/shared/config/metadata";
import { ProductEditorPage } from "@/views/operations/product-editor";

export const metadata = createMetadata({
  title: "Editar produto",
  description: "Edite os dados do produto.",
});

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEditorPage productId={id} />;
}
