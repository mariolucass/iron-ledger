"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StartTransactionForm, type TransactionStockOption } from "@/features/start-transaction";
import { FormPage } from "@/shared/ui/form-page";
import { Layout } from "@/widgets/layout";
import { fetchStockOptions } from "../model/load-transactions";

type State =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; items: TransactionStockOption[] };

/** Formulário completo para iniciar uma saga de saída (versão ampliada do diálogo da lista). */
export function NewTransactionPage() {
  const router = useRouter();
  const [state, setState] = useState<State>({ phase: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ phase: "loading" });
    fetchStockOptions()
      .then((items) => {
        if (!cancelled) setState({ phase: "ready", items });
      })
      .catch((reason) => {
        if (!cancelled)
          setState({
            phase: "error",
            message:
              reason instanceof Error ? reason.message : "Não foi possível carregar os saldos.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <Layout title="Nova transação">
      <FormPage
        back={{ href: "/transactions", label: "Transações" }}
        title="Nova transação de saída"
        description="Escolha o saldo e a quantidade. Referência externa e simulação de falha são opcionais."
        loading={state.phase === "loading"}
        error={state.phase === "error" ? state.message : undefined}
        onRetry={() => setAttempt((n) => n + 1)}
      >
        {state.phase === "ready" && (
          <StartTransactionForm
            items={state.items}
            onCancel={() => router.push("/transactions")}
            onStarted={(transaction) => router.push(`/transactions/${transaction.id}` as Route)}
          />
        )}
      </FormPage>
    </Layout>
  );
}
