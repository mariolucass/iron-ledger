"use client";
import { Save } from "lucide-react";
import { UNIT_TYPES, unitTypeLabels, type UnitOfMeasure } from "@/entities/unit-of-measure";
import { inputClass } from "@/shared/ui/form-primitives";
import { Form, FormFieldRow } from "@/shared/ui/kit/form";
import { SelectInput } from "@/shared/ui/kit/select";
import { FormActions, FormSection, fullWidth } from "@/shared/ui/form-page";
import { useUnitForm } from "../model/use-unit-form";

export function UnitForm({ onSaved, onCancel }: { onSaved: (unit: UnitOfMeasure) => void; onCancel: () => void }) {
  const { form, submit, status } = useUnitForm(onSaved);
  return <Form {...form}><form onSubmit={submit} noValidate className="grid gap-9">
    <FormSection title="Identificação">
      <FormFieldRow control={form.control} name="code" label="Código" description="Identificador único usado nos produtos.">
        {(field) => <input {...field} className={`${inputClass} uppercase font-mono`} autoComplete="off" />}
      </FormFieldRow>
      <FormFieldRow control={form.control} name="name" label="Nome">
        {(field) => <input {...field} className={inputClass} autoComplete="off" />}
      </FormFieldRow>
      <FormFieldRow control={form.control} name="type" label="Tipo">
        {(field) => <SelectInput {...field} options={UNIT_TYPES.map((value) => ({ value, label: unitTypeLabels[value] }))} />}
      </FormFieldRow>
      <FormFieldRow control={form.control} name="precision" label="Casas decimais" description="Precisão aceita nas quantidades desta unidade.">
        {(field) => <input {...field} type="number" min="0" max="6" step="1" className={inputClass} />}
      </FormFieldRow>
      <div className={fullWidth}><FormFieldRow control={form.control} name="isActive" label="Disponibilidade">
        {(field) => <label className="flex h-10 items-center gap-2 text-sm"><input type="checkbox" checked={field.value} onChange={field.onChange} className="size-4 accent-[var(--primary)]" />Unidade ativa</label>}
      </FormFieldRow></div>
    </FormSection>
    <FormActions status={status} onCancel={onCancel} submitting={form.formState.isSubmitting} icon={<Save />} submitLabel="Cadastrar unidade" />
  </form></Form>;
}
