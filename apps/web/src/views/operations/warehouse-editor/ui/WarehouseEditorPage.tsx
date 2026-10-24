"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  warehouseApi,
  warehouseTypeLabel,
  type WarehouseDetail,
  type WarehouseLocation,
} from "@/entities/warehouse";
import { LocationsPanel } from "@/features/operations/manage-locations";
import { WarehouseForm } from "@/features/operations/save-warehouse";
import { withSession } from "@/shared/auth/with-session";
import type { Status } from "@/shared/ui/form-primitives";
import { FormPage } from "@/shared/ui/form-page";
import { Badge } from "@/shared/ui/kit/badge";
import { Layout } from "@/widgets/layout";

type State =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; warehouse?: WarehouseDetail };

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 });

/** Cadastro (sem `warehouseId`) e edição de instalação, com suas localizações. */
export function WarehouseEditorPage({ warehouseId }: { warehouseId?: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>(
    warehouseId ? { phase: "loading" } : { phase: "ready" },
  );
  const [notice, setNotice] = useState<Status>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!warehouseId) return;
    let cancelled = false;
    setState({ phase: "loading" });
    withSession(warehouseApi.get(warehouseId))
      .then((warehouse) => {
        if (!cancelled) setState({ phase: "ready", warehouse });
      })
      .catch((reason) => {
        if (!cancelled)
          setState({
            phase: "error",
            message:
              reason instanceof Error ? reason.message : "Não foi possível carregar a instalação.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [warehouseId, attempt]);

  const warehouse = state.phase === "ready" ? state.warehouse : undefined;
  const setLocations = (locations: WarehouseLocation[]) =>
    setState((current) =>
      current.phase === "ready" && current.warehouse
        ? { phase: "ready", warehouse: { ...current.warehouse, locations } }
        : current,
    );

  return (
    <Layout title={warehouse ? warehouse.name : "Nova instalação"}>
      <FormPage
        wide={Boolean(warehouseId)}
        back={{ href: "/warehouses", label: "Armazéns" }}
        title={warehouseId ? (warehouse?.name ?? "Instalação") : "Nova instalação"}
        description={
          warehouseId ? undefined : "Registre um armazém, loja ou centro de distribuição."
        }
        badges={
          warehouse && (
            <>
              <Badge variant={warehouse.isActive ? "success" : "secondary"}>
                {warehouse.isActive ? "Ativa" : "Inativa"}
              </Badge>
              <Badge variant="outline">{warehouseTypeLabel[warehouse.type]}</Badge>
            </>
          )
        }
        meta={warehouse && <span className="font-mono">{warehouse.code}</span>}
        loading={state.phase === "loading"}
        error={state.phase === "error" ? state.message : undefined}
        onRetry={() => setAttempt((n) => n + 1)}
        notice={notice}
      >
        {warehouse && (
          <dl className="m-0 mb-9 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Unidades em estoque", number.format(warehouse.totalQuantity)],
              ["Reservado", number.format(warehouse.reserved)],
              ["SKUs", String(warehouse.skuCount)],
              ["Localizações", String(warehouse.locations.length)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border bg-card px-4 py-3.5">
                <dt className="text-[12.5px] text-muted-foreground">{label}</dt>
                <dd className="m-0 mt-1 text-[22px] leading-tight font-semibold tracking-[-0.03em] text-foreground tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {state.phase === "ready" && (
          <div className="grid gap-12">
            <WarehouseForm
              key={warehouse?.version ?? "new"}
              warehouse={warehouse}
              onCancel={() => router.push("/warehouses")}
              onSaved={(saved, mode) => {
                if (mode === "created") {
                  router.push(`/warehouses/${saved.id}`);
                  return;
                }
                setState({ phase: "ready", warehouse: saved });
                setNotice({ type: "success", message: "Instalação atualizada." });
              }}
            />
            {warehouse && (
              <LocationsPanel
                warehouseId={warehouse.id}
                locations={warehouse.locations}
                onChange={setLocations}
              />
            )}
          </div>
        )}
      </FormPage>
    </Layout>
  );
}
