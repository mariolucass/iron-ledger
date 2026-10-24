"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { categoryApi, type Category } from "@/entities/category";
import { ApiError } from "@/shared/api/client";
import { withSession } from "@/shared/auth/with-session";
import type { Status } from "@/shared/ui/form-primitives";
import { categoryFormSchema, emptyCategoryForm, toCategoryInput, type CategoryFormValues } from "./category-schema";
export function useCategoryForm(onSaved: (category: Category) => void) {
  const [status, setStatus] = useState<Status>(null);
  const form = useForm<CategoryFormValues>({ resolver: zodResolver(categoryFormSchema), defaultValues: emptyCategoryForm });
  const submit = form.handleSubmit(async (values) => {
    setStatus(null);
    try { onSaved(await withSession(categoryApi.create(toCategoryInput(values)))); }
    catch (reason) {
      if (reason instanceof ApiError && reason.code === "CATEGORY_ALREADY_EXISTS") {
        form.setError("code", { message: reason.message }); return;
      }
      setStatus({ type: "error", message: reason instanceof Error ? reason.message : "Não foi possível cadastrar a categoria." });
    }
  });
  return { form, submit, status };
}
