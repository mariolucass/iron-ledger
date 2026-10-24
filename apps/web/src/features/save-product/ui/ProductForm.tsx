"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext, type FieldPathByValue } from "react-hook-form";
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
import {
  Form,
  FormControl,
  FormField,
  FormFieldRow,
  FormItem,
  FormMessage,
} from "@/shared/ui/kit/form";
import { inputClass, textareaClass } from "@/shared/ui/form-primitives";
import { SelectInput, type SelectOption } from "@/shared/ui/kit/select";
import { FormActions, FormSection, fullWidth } from "@/shared/ui/form-page";
import type { ProductFormValues } from "../model/product-schema";
import { useProductForm } from "../model/use-product-form";

type StringField = FieldPathByValue<ProductFormValues, string>;

const barcodeTypeOptions = BARCODE_TYPES.map((type) => ({
  value: type,
  label: type.replace("_", " "),
}));

function ProductField({
  name,
  label,
  description,
  as = "input",
  options,
  className = "",
  inputMode,
  autoComplete,
  disabled,
  maxLength,
  placeholder,
  spellCheck,
}: {
  name: StringField;
  label: string;
  description?: string;
  as?: "input" | "textarea";
  /** Com opções, o campo vira um `SelectInput`. */
  options?: readonly SelectOption[];
  className?: string;
  inputMode?: "decimal" | "numeric";
  autoComplete?: string;
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
  spellCheck?: boolean;
}) {
  const { control } = useFormContext<ProductFormValues>();
  return (
    <FormFieldRow control={control} name={name} label={label} description={description}>
      {(field) =>
        options ? (
          <SelectInput
            {...field}
            value={String(field.value ?? "")}
            options={options}
            disabled={disabled}
          />
        ) : as === "textarea" ? (
          <textarea
            {...field}
            value={String(field.value ?? "")}
            className={`${textareaClass} ${className}`}
          />
        ) : (
          <input
            {...field}
            value={String(field.value ?? "")}
            className={`${inputClass} ${className}`}
            inputMode={inputMode}
            autoComplete={autoComplete}
            disabled={disabled}
            readOnly={disabled}
            maxLength={maxLength}
            placeholder={placeholder}
            spellCheck={spellCheck}
          />
        )
      }
    </FormFieldRow>
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
  const { isSubmitting, isDirty, errors } = form.formState;
  const barcodes = useFieldArray({ control: form.control, name: "barcodes" });

  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-9">
        <FormSection title="Identificação">
          <ProductField
            name="sku"
            label="SKU"
            description={
              isEditing
                ? "O SKU não pode ser alterado."
                : "Código único do produto; será salvo em maiúsculas."
            }
            className="font-mono uppercase"
            disabled={isEditing}
            autoComplete="off"
            spellCheck={false}
          />
          <ProductField name="name" label="Nome" autoComplete="off" />
          <div className={fullWidth}>
            <ProductField name="description" label="Descrição" as="textarea" />
          </div>
          <ProductField
            name="baseUnitId"
            label="Unidade de medida"
            options={lookups.units.map((unit) => ({
              value: unit.id,
              label: `${unit.name} (${unit.code})`,
            }))}
          />
          <ProductField
            name="categoryId"
            label="Categoria"
            options={[
              { value: "", label: "Sem categoria" },
              ...lookups.categories.map((category) => ({
                value: category.id,
                label: category.name,
                depth: category.depth,
              })),
            ]}
          />
          <ProductField
            name="status"
            label="Status"
            options={PRODUCT_STATUSES.map((value) => ({ value, label: productStatusLabel[value] }))}
          />
          <ProductField
            name="trackingMode"
            label="Rastreabilidade"
            options={TRACKING_MODES.map((value) => ({ value, label: trackingModeLabel[value] }))}
          />
        </FormSection>

        <FormSection
          title="Política de reposição"
          description="Base para os alertas de estoque e a previsão de demanda."
        >
          <ProductField
            name="minStock"
            label="Estoque mínimo"
            inputMode="decimal"
            autoComplete="off"
          />
          <ProductField
            name="maxStock"
            label="Estoque máximo"
            inputMode="decimal"
            autoComplete="off"
          />
          <ProductField
            name="reorderPoint"
            label="Ponto de reposição"
            inputMode="decimal"
            autoComplete="off"
          />
          <ProductField
            name="safetyStock"
            label="Estoque de segurança"
            inputMode="decimal"
            autoComplete="off"
          />
          <ProductField
            name="leadTimeDays"
            label="Prazo de entrega (dias)"
            inputMode="numeric"
            autoComplete="off"
          />
          <ProductField
            name="shelfLifeDays"
            label="Validade (dias)"
            inputMode="numeric"
            autoComplete="off"
          />
        </FormSection>

        <FormSection title="Logística e fiscal">
          <ProductField name="weightKg" label="Peso (kg)" inputMode="decimal" autoComplete="off" />
          <ProductField
            name="ncm"
            label="NCM"
            description="8 dígitos, com ou sem máscara."
            inputMode="numeric"
            placeholder="0000.00.00"
            autoComplete="off"
          />
          <ProductField
            name="lengthCm"
            label="Comprimento (cm)"
            inputMode="decimal"
            autoComplete="off"
          />
          <ProductField
            name="widthCm"
            label="Largura (cm)"
            inputMode="decimal"
            autoComplete="off"
          />
          <ProductField
            name="heightCm"
            label="Altura (cm)"
            inputMode="decimal"
            autoComplete="off"
          />
          <div className="grid grid-cols-[1fr_96px] gap-3">
            <ProductField
              name="standardCost"
              label="Custo padrão"
              inputMode="decimal"
              autoComplete="off"
            />
            <ProductField name="currency" label="Moeda" className="uppercase" maxLength={3} />
          </div>
        </FormSection>

        <FormSection
          title="Códigos de barras"
          description="A quantidade é a de unidades base que o código representa (ex.: caixa com 12)."
          flush
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
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
          }
        >
          {barcodes.fields.length === 0 ? (
            <p className="m-0 px-5 py-8 text-center text-[13px] text-muted-foreground">
              Nenhum código cadastrado.
            </p>
          ) : (
            barcodes.fields.map((barcode, index) => (
              <div
                key={barcode.id}
                className="grid gap-4 px-5 py-4 md:grid-cols-[1.4fr_1fr_96px_auto_auto] md:items-start md:px-6"
              >
                <ProductField
                  name={`barcodes.${index}.code`}
                  label="Código"
                  className="font-mono"
                  spellCheck={false}
                />
                <ProductField
                  name={`barcodes.${index}.type`}
                  label="Tipo"
                  options={barcodeTypeOptions}
                />
                <ProductField
                  name={`barcodes.${index}.quantity`}
                  label="Qtd."
                  inputMode="decimal"
                  autoComplete="off"
                />
                <FormField
                  control={form.control}
                  name={`barcodes.${index}.isPrimary`}
                  render={({ field }) => (
                    <FormItem className="md:pt-[21px]">
                      <FormControl>
                        <label className="flex h-10 cursor-pointer items-center gap-2 text-[13px] font-normal text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="size-4 accent-[var(--primary)]"
                          />
                          Principal
                        </label>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive md:mt-[21px]"
                  aria-label={`Remover código ${index + 1}`}
                  onClick={() => barcodes.remove(index)}
                >
                  <Trash2 />
                </Button>
              </div>
            ))
          )}
          {typeof errors.barcodes?.message === "string" && (
            <p className="m-0 px-5 py-3 text-[12.5px] text-destructive md:px-6" role="alert">
              {errors.barcodes.message}
            </p>
          )}
        </FormSection>

        <FormActions
          status={status}
          onCancel={onCancel}
          cancelLabel={isEditing ? "Voltar" : "Cancelar"}
          submitting={isSubmitting}
          disabled={isEditing && !isDirty}
          dirty={isEditing ? isDirty : undefined}
          icon={<Save />}
          submitLabel={isEditing ? "Guardar alterações" : "Cadastrar produto"}
        />
      </form>
    </Form>
  );
}
