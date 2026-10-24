"use client";
import { useRouter } from "next/navigation";
import type { Category } from "@/entities/category";
import { CategoryForm } from "@/features/operations/save-category";
import { FormPage } from "@/shared/ui/form-page";
import { Layout } from "@/widgets/layout";
export function CategoryCreatePage({ parents }: { parents: Category[] }) {
  const router = useRouter();
  return <Layout title="Nova categoria"><FormPage back={{ href: "/products/categories", label: "Categorias" }} title="Nova categoria" description="Cadastre uma categoria principal ou escolha uma categoria pai.">
    <CategoryForm parents={parents} onCancel={() => router.push("/products/categories")} onSaved={() => router.push("/products/categories")} />
  </FormPage></Layout>;
}
