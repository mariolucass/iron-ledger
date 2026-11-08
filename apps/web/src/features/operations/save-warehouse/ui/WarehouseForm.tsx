"use client";

import { formGrid } from "@/shared/ui/page-width";
import { Save } from "lucide-react";
import { WAREHOUSE_TYPES, warehouseTypeLabel, type WarehouseDetail } from "@/entities/warehouse";
import { Form, FormField, FormFieldRow, FormItem, FormMessage } from "@/shared/ui/kit/form";
import { Switch, inputClass } from "@/shared/ui/form-primitives";
import { SelectInput } from "@/shared/ui/kit/select";
import { FormActions, FormSection, fullWidth } from "@/shared/ui/form-page";
import { useWarehouseForm } from "../model/use-warehouse-form";

function timezones(current: string): string[] {
  const all =
    typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  return all.includes(current) ? all : [current, ...all];
}

export function WarehouseForm({
  warehouse,
  onSaved,
  onCancel,
}: {
  warehouse?: WarehouseDetail;
  onSaved: (warehouse: WarehouseDetail, mode: "created" | "updated") => void;
  onCancel: () => void;
}) {
  const { form, submit, status, isEditing } = useWarehouseForm({ warehouse, onSaved });
  const { isSubmitting, isDirty } = form.formState;
  const decimal = { className: inputClass, inputMode: "decimal" as const, autoComplete: "off" };

  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className={formGrid}>
        <FormSection title="Identificação">
          <FormFieldRow
            control={form.control}
            name="code"
            label="Código"
            description={
              isEditing
                ? "O código não pode ser alterado."
                : "Identificador único; será salvo em maiúsculas."
            }
          >
            {(field) => (
              <input
                {...field}
                className={`${inputClass} font-mono uppercase`}
                readOnly={isEditing}
                disabled={isEditing}
                autoComplete="off"
                spellCheck={false}
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
          <FormFieldRow
            control={form.control}
            name="taxId"
            label="CNPJ"
            description="Opcional; 14 dígitos, com ou sem máscara."
          >
            {(field) => (
              <input
                {...field}
                className={inputClass}
                inputMode="numeric"
                autoComplete="off"
                placeholder="00.000.000/0000-00"
              />
            )}
          </FormFieldRow>
        </FormSection>

        <FormSection title="Endereço">
          <FormFieldRow
            control={form.control}
            name="addressLine"
            label="Logradouro"
            className={fullWidth}
          >
            {(field) => <input {...field} className={inputClass} autoComplete="off" />}
          </FormFieldRow>
          <FormFieldRow control={form.control} name="city" label="Cidade">
            {(field) => <input {...field} className={inputClass} autoComplete="off" />}
          </FormFieldRow>
          <div className="grid grid-cols-2 gap-3">
            <FormFieldRow control={form.control} name="state" label="Estado">
              {(field) => <input {...field} className={inputClass} autoComplete="off" />}
            </FormFieldRow>
            <FormFieldRow control={form.control} name="countryCode" label="País">
              {(field) => <input {...field} className={`${inputClass} uppercase`} maxLength={2} />}
            </FormFieldRow>
          </div>
          <FormFieldRow control={form.control} name="postalCode" label="CEP">
            {(field) => <input {...field} className={inputClass} autoComplete="off" />}
          </FormFieldRow>
          <FormFieldRow control={form.control} name="timezone" label="Fuso horário">
            {(field) => (
              <SelectInput
                {...field}
                options={timezones(form.getValues("timezone")).map((zone) => ({
                  value: zone,
                  label: zone,
                }))}
              />
            )}
          </FormFieldRow>
          <FormFieldRow control={form.control} name="latitude" label="Latitude">
            {(field) => <input {...field} {...decimal} />}
          </FormFieldRow>
          <FormFieldRow control={form.control} name="longitude" label="Longitude">
            {(field) => <input {...field} {...decimal} />}
          </FormFieldRow>
        </FormSection>

        <FormSection title="Situação" columns={1}>
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem>
                <Switch
                  bare
                  checked={field.value}
                  onChange={field.onChange}
                  label="Instalação ativa"
                  description="Instalações inativas saem dos filtros e das operações. Não é possível desativar uma instalação com estoque."
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormActions
          status={status}
          onCancel={onCancel}
          cancelLabel={isEditing ? "Voltar" : "Cancelar"}
          submitting={isSubmitting}
          disabled={isEditing && !isDirty}
          dirty={isEditing ? isDirty : undefined}
          icon={<Save />}
          submitLabel={isEditing ? "Guardar alterações" : "Registrar instalação"}
        />
      </form>
    </Form>
  );
}
