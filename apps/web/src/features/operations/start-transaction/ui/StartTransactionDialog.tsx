"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { TransactionDetail } from "@/entities/transaction";
import { FormDialog } from "@/shared/ui/form-dialog";
import { useStartTransaction } from "../model/use-start-transaction";
import type { TransactionStockOption } from "../model/types";
import { StartTransactionFields } from "./StartTransactionFields";

/** Início rápido de uma saga; referência externa e simulação de falha ficam em /transactions/new. */
export function StartTransactionDialog({
  items,
  loading = false,
  onClose,
  onStarted,
}: {
  items: TransactionStockOption[];
  loading?: boolean;
  onClose: () => void;
  onStarted: (transaction: TransactionDetail) => void;
}) {
  const { form, sellable, selected, stockLevelId, error, submit } = useStartTransaction({
    items,
    onStarted,
  });

  return (
    <FormDialog
      form={form}
      onSubmit={submit}
      onClose={onClose}
      eyebrow="Saga · Temporal"
      title="Nova transação de saída"
      description="Reserva o estoque, confirma a baixa e compensa automaticamente em caso de falha."
      submitLabel="Iniciar Saga"
      submitting={form.formState.isSubmitting}
      submitDisabled={loading || !stockLevelId}
      error={error}
      footerStart={
        <Link
          href="/transactions/new"
          className="inline-flex items-center gap-1 rounded-md text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
        >
          Formulário completo <ArrowUpRight size={14} aria-hidden />
        </Link>
      }
    >
      <StartTransactionFields
        form={form}
        sellable={sellable}
        selected={selected}
        loading={loading}
      />
    </FormDialog>
  );
}
