"use client";

import { formGrid } from "@/shared/ui/page-width";
import { Form } from "@/shared/ui/kit/form";
import { FormActions, FormSection } from "@/shared/ui/form-page";
import { useRecordStockMovement } from "../model/use-record-stock-movement";
import type { MovementStockOption } from "../model/types";
import { MovementFields } from "./MovementFields";

/** Formulário completo de movimento, usado pela rota /inventory/movements/new. */
export function MovementForm({
  items,
  onCancel,
  onSuccess,
}: {
  items: MovementStockOption[];
  onCancel: () => void;
  /** Chamado após o registro; a página decide para onde seguir. */
  onSuccess: (message: string) => Promise<void>;
}) {
  const { form, stockLevelId, error, submit } = useRecordStockMovement({
    items,
    onClose: onCancel,
    onSuccess,
  });
  const submitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className={formGrid}>
        <FormSection
          span
          title="Movimento de estoque"
          description="Entradas e saídas exigem quantidade positiva; ajustes aceitam valores negativos."
          columns={1}
        >
          <MovementFields form={form} items={items} detailed />
        </FormSection>
        <FormActions
          status={error ? { type: "error", message: error } : null}
          onCancel={onCancel}
          submitting={submitting}
          submittingLabel="Enviando…"
          disabled={!stockLevelId}
          submitLabel="Registrar"
        />
      </form>
    </Form>
  );
}
