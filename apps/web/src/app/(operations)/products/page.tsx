import { createMetadata } from "@/shared/config/metadata";
import { ProductsPage } from "@/views/operations/products";
import { productServerApi } from "@/entities/product/server";

export const metadata = createMetadata({
  title: "Produtos",
  description: "Catálogo de produtos, categorias e políticas de reposição.",
  path: "/products",
});

export default async function Page() {
  const [initial, lookups] = await Promise.all([
    productServerApi.list({ page: 1, pageSize: 20 }),
    productServerApi.lookups(),
  ]);
  return <ProductsPage initial={initial} initialCategories={lookups.categories} initialUnits={lookups.units} />;
}
