import { createMetadata } from "@/shared/config/metadata";
import { ProductsPage } from "@/views/products";

export const metadata = createMetadata({
  title: "Produtos",
  description: "Catálogo de produtos, categorias e políticas de reposição.",
  path: "/products",
});

export default function Page() {
  return <ProductsPage />;
}
