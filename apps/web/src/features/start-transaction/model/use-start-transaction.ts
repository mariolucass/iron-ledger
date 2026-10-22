"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { transactionApi, type TransactionDetail } from "@/entities/transaction";
import { withSession } from "@/shared/auth/with-session";
import { startTransactionSchema } from "./start-transaction-schema";
import type { TransactionStockOption } from "./types";

interface Options {
  items: TransactionStockOption[];
  onStarted: (transaction: TransactionDetail) => void;
}

type FormInput = z.input<typeof startTransactionSchema>;
type FormOutput = z.output<typeof startTransactionSchema>;

export function useStartTransaction({ items, onStarted }: Options) {
  const sellable = useMemo(() => items.filter((item) => item.available > 0), [items]);
  const [error, setError] = useState("");
  const [idempotencyKey] = useState(() => `web-${crypto.randomUUID()}`);
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(startTransactionSchema),
    defaultValues: {
      stockLevelId: sellable[0]?.stockLevelId ?? "",
      quantity: 1,
      externalRef: "",
      failConfirmation: false,
    },
  });
  const { getValues, setValue } = form;
  const stockLevelId = form.watch("stockLevelId");
  const selected = sellable.find((item) => item.stockLevelId === stockLevelId);

  useEffect(() => {
    if (!getValues("stockLevelId") && sellable[0])
      setValue("stockLevelId", sellable[0].stockLevelId);
  }, [getValues, setValue, sellable]);

  const submit = form.handleSubmit(async (values) => {
    setError("");
    const current = sellable.find((item) => item.stockLevelId === values.stockLevelId);
    if (current && values.quantity > current.available) {
      form.setError("quantity", { message: `Disponível para este saldo: ${current.available}.` });
      return;
    }
    try {
      onStarted(await withSession(transactionApi.start(values, { idempotencyKey })));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível iniciar a transação.");
    }
  });

  return { form, sellable, selected, stockLevelId, error, submit };
}
