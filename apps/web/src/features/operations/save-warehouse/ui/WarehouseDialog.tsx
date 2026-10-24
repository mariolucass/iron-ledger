"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { WAREHOUSE_TYPES, warehouseTypeLabel, type WarehouseDetail } from "@/entities/warehouse";
import { FormDialog } from "@/shared/ui/form-dialog";
import { inputClass } from "@/shared/ui/form-primitives";
import { SelectInput } from "@/shared/ui/kit/select";
import { FormFieldRow } from "@/shared/ui/kit/form";
import { useWarehouseForm } from "../model/use-warehouse-form";

/** Cadastro rápido; endereço, CNPJ, fuso e coordenadas ficam em /warehouses/new. */
export function WarehouseDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (warehouse: WarehouseDetail) => void;
}) {
  const { form, submit, status } = useWarehouseForm({
    onSaved: (warehouse) => {
      onCreated(warehouse);
      onClose();
    },
  });

  return (
    <FormDialog
      form={form}
      onSubmit={submit}
      onClose={onClose}
      eyebrow="Armazéns"
      title="Registrar instalação"
      description="Só o essencial. Endereço e demais dados podem ser preenchidos depois."
      submitLabel="Registrar"
      submitting={form.formState.isSubmitting}
      error={status?.type === "error" ? status.message : undefined}
      footerStart={
        <Link
          href="/warehouses/new"
          className="inline-flex items-center gap-1 rounded-md text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
        >
          Formulário completo <ArrowUpRight size={14} aria-hidden />
        </Link>
      }
    >
      <FormFieldRow
        control={form.control}
        name="code"
        label="Código"
        description="Identificador único; será salvo em maiúsculas."
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
      <FormFieldRow control={form.control} name="type" label="Tipo">
        {(field) => (
          <SelectInput
            {...field}
            options={WAREHOUSE_TYPES.map((type) => ({
              value: type,
              label: warehouseTypeLabel[type],
            }))}
          />
        )}
      </FormFieldRow>
    </FormDialog>
  );
}
