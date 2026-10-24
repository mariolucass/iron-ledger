import { createMetadata } from "@/shared/config/metadata";
import { ProductEditorPage } from "@/views/operations/product-editor";

export const metadata = createMetadata({
  title: "Novo produto",
  description: "Cadastre um produto no catálogo.",
  path: "/products/new",
});

export default function Page() {
  return <ProductEditorPage />;
}
