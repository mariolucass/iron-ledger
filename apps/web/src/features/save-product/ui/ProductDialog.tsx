"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { Product, UnitOption } from "@/entities/product";
import { FormDialog } from "@/shared/ui/form-dialog";
import { inputClass } from "@/shared/ui/form-primitives";
import { SelectInput } from "@/shared/ui/kit/select";
import { FormFieldRow } from "@/shared/ui/kit/form";
import { useProductForm } from "../model/use-product-form";

/** Cadastro rápido; estoque mínimo, logística, fiscal e códigos de barras ficam em /products/new. */
export function ProductDialog({
  units,
  onClose,
  onCreated,
}: {
  units: UnitOption[];
  onClose: () => void;
  onCreated: (product: Product) => void;
}) {
  const { form, submit, status } = useProductForm({
    onSaved: (product) => {
      onCreated(product);
      onClose();
    },
  });

  return (
    <FormDialog
      form={form}
      onSubmit={submit}
      onClose={onClose}
      eyebrow="Catálogo"
      title="Novo produto"
      description="Só o essencial. Você completa o restante depois, na página do produto."
      submitLabel="Cadastrar"
      submitting={form.formState.isSubmitting}
      error={status?.type === "error" ? status.message : undefined}
      footerStart={
        <Link
          href="/products/new"
          className="inline-flex items-center gap-1 rounded-md text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
        >
          Formulário completo <ArrowUpRight size={14} aria-hidden />
        </Link>
      }
    >
      <FormFieldRow
        control={form.control}
        name="sku"
        label="SKU"
        description="Código único; será salvo em maiúsculas."
      >
        {(field) => (
          <input
            {...field}
            className={`${inputClass} font-mono uppercase`}
            autoComplete="off"
            spellCheck={false}
            autoFocus
          />
        )}
      </FormFieldRow>
      <FormFieldRow control={form.control} name="name" label="Nome">
        {(field) => <input {...field} className={inputClass} autoComplete="off" />}
      </FormFieldRow>
      <FormFieldRow control={form.control} name="baseUnitId" label="Unidade de medida">
        {(field) => (
          <SelectInput
            {...field}
            options={units.map((unit) => ({
              value: unit.id,
              label: `${unit.name} (${unit.code})`,
            }))}
          />
        )}
      </FormFieldRow>
    </FormDialog>
  );
}
