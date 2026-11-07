"use client";
import { formGrid } from "@/shared/ui/page-width";
import { Save } from "lucide-react";
import type { Category } from "@/entities/category";
import { inputClass, textareaClass } from "@/shared/ui/form-primitives";
import { Form, FormFieldRow } from "@/shared/ui/kit/form";
import { SelectInput } from "@/shared/ui/kit/select";
import { FormActions, FormSection, fullWidth } from "@/shared/ui/form-page";
import { useCategoryForm } from "../model/use-category-form";

export function CategoryForm({ parents, onSaved, onCancel }: { parents: Category[]; onSaved: (category: Category) => void; onCancel: () => void }) {
  const { form, submit, status } = useCategoryForm(onSaved);
  return <Form {...form}><form onSubmit={submit} noValidate className={formGrid}>
    <FormSection title="Identificação">
      <FormFieldRow control={form.control} name="code" label="Código" description="Identificador único da categoria.">
        {(field) => <input {...field} className={`${inputClass} uppercase font-mono`} autoComplete="off" />}
      </FormFieldRow>
      <FormFieldRow control={form.control} name="name" label="Nome">
        {(field) => <input {...field} className={inputClass} autoComplete="off" />}
      </FormFieldRow>
      <div className={fullWidth}><FormFieldRow control={form.control} name="description" label="Descrição">
        {(field) => <textarea {...field} className={textareaClass} />}
      </FormFieldRow></div>
    </FormSection>
    <FormSection title="Organização" description="A categoria pai define a posição na árvore do catálogo.">
      <FormFieldRow control={form.control} name="parentId" label="Categoria pai">
        {(field) => <SelectInput {...field} options={[{ value: "", label: "Categoria principal" }, ...parents.map((parent) => ({ value: parent.id, label: parent.name, depth: parent.depth }))]} />}
      </FormFieldRow>
      <FormFieldRow control={form.control} name="sortOrder" label="Ordem de exibição">
        {(field) => <input {...field} type="number" min="0" step="1" className={inputClass} />}
      </FormFieldRow>
      <div className={fullWidth}><FormFieldRow control={form.control} name="isActive" label="Disponibilidade">
        {(field) => <label className="flex h-10 items-center gap-2 text-sm"><input type="checkbox" checked={field.value} onChange={field.onChange} className="size-4 accent-[var(--primary)]" />Categoria ativa</label>}
      </FormFieldRow></div>
    </FormSection>
    <FormActions status={status} onCancel={onCancel} submitting={form.formState.isSubmitting} icon={<Save />} submitLabel="Cadastrar categoria" />
  </form></Form>;
}
