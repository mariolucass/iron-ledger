"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MovementForm } from "@/features/record-stock-movement";
import { FormPage } from "@/shared/ui/form-page";
import { Layout } from "@/widgets/layout";
import type { InventoryItem } from "../model/inventoryData";
import { fetchMovementOptions } from "../model/load-inventory";

type State =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; items: InventoryItem[] };

/** Formulário completo de movimento de estoque (versão ampliada do diálogo da lista). */
export function NewMovementPage() {
  const router = useRouter();
  const [state, setState] = useState<State>({ phase: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ phase: "loading" });
    fetchMovementOptions()
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
    <Layout title="Novo movimento">
      <FormPage
        back={{ href: "/inventory", label: "Estoque" }}
        title="Novo movimento"
        description="Registre uma entrada, saída, ajuste ou retorno com referência e observação."
        loading={state.phase === "loading"}
        error={state.phase === "error" ? state.message : undefined}
        onRetry={() => setAttempt((n) => n + 1)}
      >
        {state.phase === "ready" && (
          <MovementForm
            items={state.items}
            onCancel={() => router.push("/inventory")}
            onSuccess={async () => {}}
          />
        )}
      </FormPage>
    </Layout>
  );
}
