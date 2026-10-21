"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useFieldArray, type UseFormRegisterReturn } from "react-hook-form";
import {
  BARCODE_TYPES,
  PRODUCT_STATUSES,
  TRACKING_MODES,
  productStatusLabel,
  trackingModeLabel,
  type Product,
  type ProductLookups,
} from "@/entities/product";
import { Button } from "@/shared/ui/kit/button";
import { Field, StatusMessage, inputClass } from "@/shared/ui/form-primitives";
import { useProductForm } from "../model/use-product-form";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="m-0 text-base font-bold text-foreground">{title}</h2>
      {description && <p className="mt-1 mb-0 text-[13px] text-muted-foreground">{description}</p>}
      <div className="mt-5 grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function ProductForm({
  product,
  lookups,
  onSaved,
  onCancel,
}: {
  product?: Product;
  lookups: ProductLookups;
  onSaved: (product: Product, mode: "created" | "updated") => void;
  onCancel: () => void;
}) {
  const { form, submit, status, isEditing } = useProductForm({ product, onSaved });
  const {
    register,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = form;
  const barcodes = useFieldArray({ control, name: "barcodes" });

  const input = (name: UseFormRegisterReturn) => ({ ...name, className: inputClass });
  const number = (name: Parameters<typeof register>[0], extra: object = {}) => ({
    ...register(name),
    className: inputClass,
    inputMode: "decimal" as const,
    autoComplete: "off",
    ...extra,
  });

  return (
    <form onSubmit={submit} noValidate className="grid max-w-[960px] gap-6">
      <Section title="Identificação">
        <Field
          label="SKU"
          error={errors.sku?.message}
          hint={
            isEditing
              ? "O SKU não pode ser alterado."
              : "Código único do produto; será salvo em maiúsculas."
          }
        >
          {(props) => (
            <input
              {...props}
              {...input(register("sku"))}
              className={`${inputClass} font-mono uppercase`}
              readOnly={isEditing}
              disabled={isEditing}
              autoComplete="off"
              spellCheck={false}
            />
          )}
        </Field>
        <Field label="Nome" error={errors.name?.message}>
          {(props) => <input {...props} {...input(register("name"))} autoComplete="off" />}
        </Field>
        <div className="md:col-span-2">
          <Field label="Descrição" error={errors.description?.message}>
            {(props) => (
              <textarea
                {...props}
                {...register("description")}
                className={`${inputClass} min-h-24 py-3`}
              />
            )}
          </Field>
        </div>
        <Field label="Unidade de medida" error={errors.baseUnitId?.message}>
          {(props) => (
            <select {...props} {...input(register("baseUnitId"))}>
              <option value="">Selecione…</option>
              {lookups.units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.code})
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Categoria" error={errors.categoryId?.message}>
          {(props) => (
            <select {...props} {...input(register("categoryId"))}>
              <option value="">Sem categoria</option>
              {lookups.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {"— ".repeat(category.depth)}
                  {category.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Status" error={errors.status?.message}>
          {(props) => (
            <select {...props} {...input(register("status"))}>
              {PRODUCT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {productStatusLabel[value]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Rastreabilidade" error={errors.trackingMode?.message}>
          {(props) => (
            <select {...props} {...input(register("trackingMode"))}>
              {TRACKING_MODES.map((value) => (
                <option key={value} value={value}>
                  {trackingModeLabel[value]}
                </option>
              ))}
            </select>
          )}
        </Field>
      </Section>

      <Section
        title="Política de reposição"
        description="Base para os alertas de estoque e a previsão de demanda."
      >
        <Field label="Estoque mínimo" error={errors.minStock?.message}>
          {(props) => <input {...props} {...number("minStock")} />}
        </Field>
        <Field label="Estoque máximo" error={errors.maxStock?.message}>
          {(props) => <input {...props} {...number("maxStock")} />}
        </Field>
        <Field label="Ponto de reposição" error={errors.reorderPoint?.message}>
          {(props) => <input {...props} {...number("reorderPoint")} />}
        </Field>
        <Field label="Estoque de segurança" error={errors.safetyStock?.message}>
          {(props) => <input {...props} {...number("safetyStock")} />}
        </Field>
        <Field label="Prazo de entrega (dias)" error={errors.leadTimeDays?.message}>
          {(props) => <input {...props} {...number("leadTimeDays", { inputMode: "numeric" })} />}
        </Field>
        <Field label="Validade (dias)" error={errors.shelfLifeDays?.message}>
          {(props) => <input {...props} {...number("shelfLifeDays", { inputMode: "numeric" })} />}
        </Field>
      </Section>

      <Section title="Logística e fiscal">
        <Field label="Peso (kg)" error={errors.weightKg?.message}>
          {(props) => <input {...props} {...number("weightKg")} />}
        </Field>
        <Field label="NCM" error={errors.ncm?.message} hint="8 dígitos, com ou sem máscara.">
          {(props) => (
            <input
              {...props}
              {...number("ncm", { inputMode: "numeric", placeholder: "0000.00.00" })}
            />
          )}
        </Field>
        <Field label="Comprimento (cm)" error={errors.lengthCm?.message}>
          {(props) => <input {...props} {...number("lengthCm")} />}
        </Field>
        <Field label="Largura (cm)" error={errors.widthCm?.message}>
          {(props) => <input {...props} {...number("widthCm")} />}
        </Field>
        <Field label="Altura (cm)" error={errors.heightCm?.message}>
          {(props) => <input {...props} {...number("heightCm")} />}
        </Field>
        <div className="grid grid-cols-[1fr_96px] gap-3">
          <Field label="Custo padrão" error={errors.standardCost?.message}>
            {(props) => <input {...props} {...number("standardCost")} />}
          </Field>
          <Field label="Moeda" error={errors.currency?.message}>
            {(props) => (
              <input
                {...props}
                {...input(register("currency"))}
                className={`${inputClass} uppercase`}
                maxLength={3}
              />
            )}
          </Field>
        </div>
      </Section>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-base font-bold text-foreground">Códigos de barras</h2>
            <p className="mt-1 mb-0 text-[13px] text-muted-foreground">
              A quantidade é a de unidades base que o código representa (ex.: caixa com 12).
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              barcodes.append({
                code: "",
                type: "EAN_13",
                quantity: "1",
                isPrimary: barcodes.fields.length === 0,
              })
            }
          >
            <Plus /> Adicionar
          </Button>
        </div>

        {barcodes.fields.length === 0 ? (
          <p className="mt-5 mb-0 text-[13px] text-muted-foreground">Nenhum código cadastrado.</p>
        ) : (
          <ul className="m-0 mt-5 grid list-none gap-4 p-0">
            {barcodes.fields.map((field, index) => {
              const rowErrors = errors.barcodes?.[index];
              return (
                <li
                  key={field.id}
                  className="grid gap-4 rounded-lg border border-border bg-background p-4 md:grid-cols-[1.4fr_1fr_110px_auto_auto] md:items-start"
                >
                  <Field label="Código" error={rowErrors?.code?.message}>
                    {(props) => (
                      <input
                        {...props}
                        {...input(register(`barcodes.${index}.code`))}
                        className={`${inputClass} font-mono`}
                        spellCheck={false}
                      />
                    )}
                  </Field>
                  <Field label="Tipo">
                    {(props) => (
                      <select {...props} {...input(register(`barcodes.${index}.type`))}>
                        {BARCODE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                  <Field label="Qtd." error={rowErrors?.quantity?.message}>
                    {(props) => <input {...props} {...number(`barcodes.${index}.quantity`)} />}
                  </Field>
                  <label className="flex h-11 cursor-pointer items-center gap-2 self-end text-[13px] text-muted-foreground">
                    <input
                      type="checkbox"
                      className="size-4 accent-[var(--primary)]"
                      {...register(`barcodes.${index}.isPrimary`)}
                    />{" "}
                    Principal
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="self-end text-destructive"
                    aria-label={`Remover código ${index + 1}`}
                    onClick={() => barcodes.remove(index)}
                  >
                    <Trash2 />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        {typeof errors.barcodes?.message === "string" && (
          <p className="mt-3 mb-0 text-[13px] text-destructive" role="alert">
            {errors.barcodes.message}
          </p>
        )}
      </section>

      <StatusMessage status={status} />

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" size="lg" onClick={onCancel} disabled={isSubmitting}>
          {isEditing ? "Voltar" : "Cancelar"}
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting || (isEditing && !isDirty)}>
          <Save />{" "}
          {isSubmitting ? "Salvando…" : isEditing ? "Guardar alterações" : "Cadastrar produto"}
        </Button>
      </div>
    </form>
  );
}
