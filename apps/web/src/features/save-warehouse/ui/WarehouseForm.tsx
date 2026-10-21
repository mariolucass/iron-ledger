"use client";

import { Save } from "lucide-react";
import type { ReactNode } from "react";
import { WAREHOUSE_TYPES, warehouseTypeLabel, type WarehouseDetail } from "@/entities/warehouse";
import { Button } from "@/shared/ui/kit/button";
import { Field, StatusMessage, Switch, inputClass } from "@/shared/ui/form-primitives";
import { useWarehouseForm } from "../model/use-warehouse-form";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="m-0 text-base font-bold text-foreground">{title}</h2>
      <div className="mt-5 grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

function timezones(current: string): string[] {
  const all = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
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
  const {
    register,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = form;
  const decimal = { className: inputClass, inputMode: "decimal" as const, autoComplete: "off" };

  return (
    <form onSubmit={submit} noValidate className="grid max-w-[960px] gap-6">
      <Section title="Identificação">
        <Field label="Código" error={errors.code?.message} hint={isEditing ? "O código não pode ser alterado." : "Identificador único; será salvo em maiúsculas."}>
          {(props) => (
            <input {...props} {...register("code")} className={`${inputClass} font-mono uppercase`} readOnly={isEditing} disabled={isEditing} autoComplete="off" spellCheck={false} />
          )}
        </Field>
        <Field label="Nome" error={errors.name?.message}>
          {(props) => <input {...props} {...register("name")} className={inputClass} autoComplete="off" />}
        </Field>
        <Field label="Tipo" error={errors.type?.message}>
          {(props) => (
            <select {...props} {...register("type")} className={inputClass}>
              {WAREHOUSE_TYPES.map((type) => <option key={type} value={type}>{warehouseTypeLabel[type]}</option>)}
            </select>
          )}
        </Field>
        <Field label="CNPJ" error={errors.taxId?.message} hint="Opcional; 14 dígitos, com ou sem máscara.">
          {(props) => <input {...props} {...register("taxId")} className={inputClass} inputMode="numeric" autoComplete="off" placeholder="00.000.000/0000-00" />}
        </Field>
      </Section>

      <Section title="Endereço">
        <div className="md:col-span-2">
          <Field label="Logradouro" error={errors.addressLine?.message}>
            {(props) => <input {...props} {...register("addressLine")} className={inputClass} autoComplete="off" />}
          </Field>
        </div>
        <Field label="Cidade" error={errors.city?.message}>
          {(props) => <input {...props} {...register("city")} className={inputClass} autoComplete="off" />}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Estado" error={errors.state?.message}>
            {(props) => <input {...props} {...register("state")} className={inputClass} autoComplete="off" />}
          </Field>
          <Field label="País" error={errors.countryCode?.message}>
            {(props) => <input {...props} {...register("countryCode")} className={`${inputClass} uppercase`} maxLength={2} />}
          </Field>
        </div>
        <Field label="CEP" error={errors.postalCode?.message}>
          {(props) => <input {...props} {...register("postalCode")} className={inputClass} autoComplete="off" />}
        </Field>
        <Field label="Fuso horário" error={errors.timezone?.message}>
          {(props) => (
            <select {...props} {...register("timezone")} className={inputClass}>
              {timezones(form.getValues("timezone")).map((zone) => <option key={zone} value={zone}>{zone}</option>)}
            </select>
          )}
        </Field>
        <Field label="Latitude" error={errors.latitude?.message}>
          {(props) => <input {...props} {...register("latitude")} {...decimal} />}
        </Field>
        <Field label="Longitude" error={errors.longitude?.message}>
          {(props) => <input {...props} {...register("longitude")} {...decimal} />}
        </Field>
      </Section>

      <Switch
        label="Instalação ativa"
        description="Instalações inativas saem dos filtros e das operações. Não é possível desativar uma instalação com estoque."
        checked={watch("isActive")}
        onChange={(next) => setValue("isActive", next, { shouldDirty: true })}
      />

      <StatusMessage status={status} />

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" size="lg" onClick={onCancel} disabled={isSubmitting}>
          {isEditing ? "Voltar" : "Cancelar"}
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting || (isEditing && !isDirty)}>
          <Save /> {isSubmitting ? "Salvando…" : isEditing ? "Guardar alterações" : "Registrar instalação"}
        </Button>
      </div>
    </form>
  );
}
