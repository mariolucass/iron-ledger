"use client";

import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import {
  FormControl,
  FormField,
  FormFieldRow,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/kit/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/kit/select";
import { inputClass, selectTriggerClass, textareaClass } from "@/shared/ui/form-primitives";
import type { movementSchema } from "../model/movement-schema";
import type { MovementStockOption } from "../model/types";

type FormInput = z.input<typeof movementSchema>;
type FormOutput = z.output<typeof movementSchema>;

interface Props {
  form: UseFormReturn<FormInput, unknown, FormOutput>;
  items: MovementStockOption[];
  /** Inclui referência e observação (formulário completo). */
  detailed?: boolean;
}

/** Campos do movimento de estoque, compartilhados entre o diálogo rápido e a página completa. */
export function MovementFields({ form, items, detailed = false }: Props) {
  return (
    <>
      <FormField
        control={form.control}
        name="stockLevelId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Produto e depósito</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger ref={field.ref} className={selectTriggerClass}>
                  <SelectValue placeholder="Selecione um saldo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {items
                  .filter((item) => item.stockLevelId)
                  .map((item) => (
                    <SelectItem key={item.stockLevelId} value={item.stockLevelId}>
                      {item.sku} · {item.product} · {item.warehouse}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid gap-4 md:grid-cols-2 md:gap-5">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger ref={field.ref} className={selectTriggerClass}>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="INBOUND">Entrada</SelectItem>
                  <SelectItem value="OUTBOUND">Saída</SelectItem>
                  <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
                  <SelectItem value="RETURN">Retorno</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormFieldRow control={form.control} name="quantity" label="Quantidade">
          {(field) => (
            <input
              type="number"
              step="0.0001"
              value={Number.isNaN(field.value) ? "" : field.value}
              onChange={(event) => field.onChange(event.target.valueAsNumber)}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              className={inputClass}
            />
          )}
        </FormFieldRow>
      </div>
      {detailed && (
        <>
          <FormFieldRow
            control={form.control}
            name="referenceId"
            label="Referência"
            description="Documento ou transação que originou o movimento."
          >
            {(field) => (
              <input
                {...field}
                value={field.value ?? ""}
                placeholder="Ex.: TXN-000123"
                maxLength={120}
                className={inputClass}
              />
            )}
          </FormFieldRow>
          <FormFieldRow control={form.control} name="notes" label="Observação">
            {(field) => (
              <textarea
                {...field}
                value={field.value ?? ""}
                maxLength={500}
                rows={3}
                className={textareaClass}
              />
            )}
          </FormFieldRow>
        </>
      )}
    </>
  );
}
