"use client";

import { useMemo, useState, type FormEvent } from "react";
import { transactionApi, type TransactionDetail } from "@/entities/transaction";
import { withSession } from "@/shared/auth/with-session";
import { startTransactionSchema } from "./start-transaction-schema";
import type { TransactionStockOption } from "./types";

interface Options {
  items: TransactionStockOption[];
  onStarted: (transaction: TransactionDetail) => void;
}

export function useStartTransaction({ items, onStarted }: Options) {
  const sellable = useMemo(() => items.filter((item) => item.available > 0), [items]);
  const [chosenStockLevelId, setStockLevelId] = useState("");
  // Os saldos podem chegar depois da abertura do formulário: assume o primeiro disponível.
  const stockLevelId = chosenStockLevelId || sellable[0]?.stockLevelId || "";
  const [quantity, setQuantity] = useState("1");
  const [externalRef, setExternalRef] = useState("");
  const [failConfirmation, setFailConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Uma chave por abertura do formulário: reenvios do mesmo pedido não duplicam a transação.
  const [idempotencyKey] = useState(() => `web-${crypto.randomUUID()}`);

  const selected = sellable.find((item) => item.stockLevelId === stockLevelId);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const result = startTransactionSchema.safeParse({ stockLevelId, quantity, externalRef, failConfirmation });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }
    if (selected && result.data.quantity > selected.available) {
      setError(`Disponível para este saldo: ${selected.available}.`);
      return;
    }
    setSubmitting(true);
    try {
      onStarted(await withSession(transactionApi.start(result.data, { idempotencyKey })));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível iniciar a transação.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    sellable, selected, stockLevelId, setStockLevelId, quantity, setQuantity,
    externalRef, setExternalRef, failConfirmation, setFailConfirmation, error, submitting, submit,
  };
}
