import { z } from "zod";

export const createCategorySchema = z.object({
  code: z.string().trim().min(2).max(64).regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Código inválido").transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2, "Informe o nome da categoria").max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});
/** Segmento do `path` materializado: "Vestuário Infantil" → "vestuario-infantil". */
export const categorySlug = (name: string) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const listCategoriesSchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesSchema>;
export type CategoryItem = {
  id: string; parentId: string | null; code: string; name: string; slug: string; path: string;
  depth: number; description: string | null; sortOrder: number; isActive: boolean;
  createdAt: string; updatedAt: string;
};
export interface CategoryRepository {
  list(query: ListCategoriesQuery): Promise<{ items: CategoryItem[]; total: number; page: number; pageSize: number }>;
  findById(id: string): Promise<CategoryItem | null>;
  create(input: CreateCategoryInput & { slug: string; path: string; depth: number }): Promise<CategoryItem>;
}
