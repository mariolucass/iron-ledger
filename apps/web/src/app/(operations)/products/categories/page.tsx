import { categoryServerApi } from "@/entities/category/server";
import { createMetadata } from "@/shared/config/metadata";
import { CategoriesPage } from "@/views/operations/product-categories";
export const metadata = createMetadata({ title: "Categorias", description: "Categorias do catálogo", path: "/products/categories" });
export default async function Page() {
  const initial = await categoryServerApi.list({ page: 1, pageSize: 20 });
  return <CategoriesPage initial={initial} />;
}
