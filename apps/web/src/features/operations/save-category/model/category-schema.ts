import { z } from "zod";
import type { CreateCategoryInput } from "@/entities/category";
export const categoryFormSchema = z.object({
  code: z.string().trim().min(2, "Informe o código.").max(64).regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Use letras, números, ponto, hífen ou sublinhado."),
  name: z.string().trim().min(2, "Informe o nome.").max(200),
  description: z.string().trim().max(2000),
  parentId: z.string(),
  sortOrder: z.string().regex(/^\d+$/, "Informe um número inteiro maior ou igual a zero."),
  isActive: z.boolean(),
});
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
export const emptyCategoryForm: CategoryFormValues = { code: "", name: "", description: "", parentId: "", sortOrder: "0", isActive: true };
export const toCategoryInput = (values: CategoryFormValues): CreateCategoryInput => ({
  code: values.code.trim().toUpperCase(), name: values.name.trim(), description: values.description.trim() || null,
  parentId: values.parentId || null, sortOrder: Number(values.sortOrder), isActive: values.isActive,
});
