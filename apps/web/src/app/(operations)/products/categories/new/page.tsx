import { categoryServerApi } from "@/entities/category/server";
import { createMetadata } from "@/shared/config/metadata";
import { CategoryCreatePage } from "@/views/operations/product-categories";
export const metadata = createMetadata({ title: "Nova categoria", description: "Cadastro de categoria", path: "/products/categories/new" });
export default async function Page() {
  const first = await categoryServerApi.list({ page: 1, pageSize: 100 });
  const remaining = await Promise.all(
    Array.from({ length: Math.ceil(first.total / 100) - 1 }, (_, index) =>
      categoryServerApi.list({ page: index + 2, pageSize: 100 }),
    ),
  );
  const parents = [first, ...remaining].flatMap((page) => page.items).filter((category) => category.isActive);
  return <CategoryCreatePage parents={parents} />;
}
