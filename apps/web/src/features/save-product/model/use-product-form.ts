"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { productApi, type Product } from "@/entities/product";
import { ApiError } from "@/shared/api/client";
import { withSession } from "@/shared/auth/with-session";
import type { Status } from "@/shared/ui/form-primitives";
import {
  emptyProductForm,
  productFormSchema,
  toFormValues,
  toProductInput,
  type ProductFormValues,
} from "./product-schema";

interface Options {
  product?: Product;
  onSaved: (product: Product, mode: "created" | "updated") => void;
}

export function useProductForm({ product, onSaved }: Options) {
  const [status, setStatus] = useState<Status>(null);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product ? toFormValues(product) : emptyProductForm,
  });

  const submit = form.handleSubmit(async (values) => {
    setStatus(null);
    const input = toProductInput(values);
    try {
      if (product) {
        const saved = await withSession(productApi.update(product.id, input));
        form.reset(toFormValues(saved));
        onSaved(saved, "updated");
      } else {
        onSaved(
          await withSession(productApi.create({ ...input, sku: values.sku.trim().toUpperCase() })),
          "created",
        );
      }
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === "SKU_ALREADY_EXISTS") {
        form.setError("sku", { message: reason.message });
        form.setFocus("sku");
        return;
      }
      setStatus({
        type: "error",
        message: reason instanceof Error ? reason.message : "Não foi possível salvar o produto.",
      });
    }
  });

  return { form, submit, status, isEditing: Boolean(product) };
}
