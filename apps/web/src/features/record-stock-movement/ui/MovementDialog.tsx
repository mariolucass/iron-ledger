"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { FormDialog } from "@/shared/ui/form-dialog";
import { useRecordStockMovement } from "../model/use-record-stock-movement";
import type { MovementStockOption } from "../model/types";
import { MovementFields } from "./MovementFields";

/** Registro rápido de movimento; referência e observação ficam em /inventory/movements/new. */
export function MovementDialog({
  items,
  onClose,
  onSuccess,
}: {
  items: MovementStockOption[];
  onClose: () => void;
  onSuccess: (message: string) => Promise<void>;
}) {
  const { form, stockLevelId, error, submit } = useRecordStockMovement({
    items,
    onClose,
    onSuccess,
  });

  return (
    <FormDialog
      form={form}
      onSubmit={submit}
      onClose={onClose}
      eyebrow="Inventário"
      title="Novo movimento"
      submitLabel="Registrar"
      submitting={form.formState.isSubmitting}
      submitDisabled={!stockLevelId}
      error={error}
      footerStart={
        <Link
          href="/inventory/movements/new"
          className="inline-flex items-center gap-1 rounded-md text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
        >
          Formulário completo <ArrowUpRight size={14} aria-hidden />
        </Link>
      }
    >
      <MovementFields form={form} items={items} />
    </FormDialog>
  );
}
