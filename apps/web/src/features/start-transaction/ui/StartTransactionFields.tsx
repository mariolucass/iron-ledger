"use client";

import type { UseFormReturn } from "react-hook-form";
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
import { Switch, inputClass, selectTriggerClass } from "@/shared/ui/form-primitives";
import type { z } from "zod";
import type {
  StartTransactionForm,
  startTransactionSchema,
} from "../model/start-transaction-schema";
import type { TransactionStockOption } from "../model/types";

type FormInput = z.input<typeof startTransactionSchema>;

interface Props {
  form: UseFormReturn<FormInput, unknown, StartTransactionForm>;
  sellable: TransactionStockOption[];
  selected?: TransactionStockOption;
  loading?: boolean;
  /** Inclui referência externa e simulação de falha (formulário completo). */
  detailed?: boolean;
}

/** Campos da saga de saída, compartilhados entre o diálogo rápido e a página completa. */
export function StartTransactionFields({
  form,
  sellable,
  selected,
  loading = false,
  detailed = false,
}: Props) {
  return (
    <>
      <FormField
        control={form.control}
        name="stockLevelId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Produto e depósito</FormLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={loading || sellable.length === 0}
            >
              <FormControl>
                <SelectTrigger ref={field.ref} className={selectTriggerClass}>
                  <SelectValue
                    placeholder={
                      loading
                        ? "Carregando saldos…"
                        : sellable.length === 0
                          ? "Nenhum saldo disponível"
                          : "Selecione um saldo"
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {sellable.map((item) => (
                  <SelectItem key={item.stockLevelId} value={item.stockLevelId}>
                    {item.sku} · {item.product} · {item.warehouse} ({item.available} disp.)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className={detailed ? "grid gap-5 md:grid-cols-2" : "grid gap-4"}>
        <FormFieldRow
          control={form.control}
          name="quantity"
          label="Quantidade"
          description={selected ? `Disponível neste saldo: ${selected.available}.` : undefined}
        >
          {(field) => (
            <input
              type="number"
              min="0"
              step="0.0001"
              max={selected?.available}
              value={Number.isNaN(field.value) ? "" : field.value}
              onChange={(event) => field.onChange(event.target.valueAsNumber)}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              className={inputClass}
            />
          )}
        </FormFieldRow>
        {detailed && (
          <FormFieldRow
            control={form.control}
            name="externalRef"
            label="Referência externa"
            description="Identificador do pedido ou documento de origem."
          >
            {(field) => (
              <input
                {...field}
                value={field.value ?? ""}
                placeholder="Ex.: PED-10293"
                maxLength={120}
                className={inputClass}
              />
            )}
          </FormFieldRow>
        )}
      </div>
      {detailed && (
        <FormField
          control={form.control}
          name="failConfirmation"
          render={({ field }) => (
            <FormItem>
              <div className="border-t border-border pt-5">
                <Switch
                  bare
                  checked={field.value}
                  onChange={field.onChange}
                  label="Simular falha na confirmação"
                  description="Demonstra a compensação: a reserva é liberada e o saldo volta ao disponível."
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
}
