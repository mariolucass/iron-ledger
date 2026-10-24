"use client";

import type { TransactionDetail } from "@/entities/transaction";
import { Form } from "@/shared/ui/kit/form";
import { FormActions, FormSection } from "@/shared/ui/form-page";
import { useStartTransaction } from "../model/use-start-transaction";
import type { TransactionStockOption } from "../model/types";
import { StartTransactionFields } from "./StartTransactionFields";

/** Formulário completo da saga de saída, usado pela rota /transactions/new. */
export function StartTransactionForm({
  items,
  onCancel,
  onStarted,
}: {
  items: TransactionStockOption[];
  onCancel: () => void;
  onStarted: (transaction: TransactionDetail) => void;
}) {
  const { form, sellable, selected, stockLevelId, error, submit } = useStartTransaction({
    items,
    onStarted,
  });
  const submitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-9">
        <FormSection
          title="Saída de estoque"
          description="Reserva o estoque, confirma a baixa e compensa automaticamente em caso de falha."
          columns={1}
        >
          <StartTransactionFields form={form} sellable={sellable} selected={selected} detailed />
        </FormSection>
        <FormActions
          status={error ? { type: "error", message: error } : null}
          onCancel={onCancel}
          submitting={submitting}
          submittingLabel="Enviando…"
          disabled={!stockLevelId}
          submitLabel="Iniciar Saga"
        />
      </form>
    </Form>
  );
}
