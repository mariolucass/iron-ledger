import type { Route } from "next";
import type { PlannedPage } from "@/shared/config/planned-page";

/** Árvore de categorias do catálogo (catalog.Category, ProductCategory). */
export const productCategoryPages = {
  list: {
    title: "Categorias",
    description: "Árvore de categorias do catálogo, com ordenação e situação.",
    back: { href: "/products", label: "Produtos" },
    action: { href: "/products/categories/new", label: "Nova categoria" },
  },
  create: {
    title: "Nova categoria",
    description: "Defina código, nome, categoria pai e ordem de exibição.",
    back: { href: "/products/categories", label: "Categorias" },
  },
  detail: (id: string): PlannedPage => ({
    title: "Categoria",
    description: "Subcategorias e produtos atribuídos a esta categoria.",
    back: { href: "/products/categories", label: "Categorias" },
    action: { href: `/products/categories/${id}/edit` as Route, label: "Editar categoria" },
  }),
  edit: (id: string): PlannedPage => ({
    title: "Editar categoria",
    description: "Ajuste nome, categoria pai, ordem e situação da categoria.",
    back: { href: `/products/categories/${id}` as Route, label: "Categoria" },
  }),
} satisfies Record<string, PlannedPage | ((...params: string[]) => PlannedPage)>;
