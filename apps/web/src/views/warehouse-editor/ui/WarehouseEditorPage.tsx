"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { warehouseApi, warehouseTypeLabel, type WarehouseDetail, type WarehouseLocation } from "@/entities/warehouse";
import { LocationsPanel } from "@/features/manage-locations";
import { WarehouseForm } from "@/features/save-warehouse";
import { withSession } from "@/shared/auth/with-session";
import { PageHeader } from "@/shared/ui/data-list";
import { StatusMessage, type Status } from "@/shared/ui/form-primitives";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { Layout } from "@/widgets/layout";

type State =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; warehouse?: WarehouseDetail };

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 });

/** Cadastro (sem `warehouseId`) e edição de instalação, com suas localizações. */
export function WarehouseEditorPage({ warehouseId }: { warehouseId?: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>(warehouseId ? { phase: "loading" } : { phase: "ready" });
  const [notice, setNotice] = useState<Status>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!warehouseId) return;
    let cancelled = false;
    setState({ phase: "loading" });
    withSession(warehouseApi.get(warehouseId))
      .then((warehouse) => { if (!cancelled) setState({ phase: "ready", warehouse }); })
      .catch((reason) => {
        if (!cancelled) setState({ phase: "error", message: reason instanceof Error ? reason.message : "Não foi possível carregar a instalação." });
      });
    return () => { cancelled = true; };
  }, [warehouseId, attempt]);

  const warehouse = state.phase === "ready" ? state.warehouse : undefined;
  const setLocations = (locations: WarehouseLocation[]) =>
    setState((current) => (current.phase === "ready" && current.warehouse ? { phase: "ready", warehouse: { ...current.warehouse, locations } } : current));

  return (
    <Layout title={warehouse ? warehouse.name : "Nova instalação"}>
      <PageHeader
        back={{ href: "/warehouses", label: "Armazéns" }}
        title={warehouseId ? (warehouse?.name ?? "Instalação") : "Nova instalação"}
        badges={
          warehouse && (
            <>
              <Badge variant={warehouse.isActive ? "success" : "secondary"}>{warehouse.isActive ? "Ativa" : "Inativa"}</Badge>
              <Badge variant="outline">{warehouseTypeLabel[warehouse.type]}</Badge>
            </>
          )
        }
        meta={warehouse && <span className="font-mono">{warehouse.code}</span>}
      />

      {warehouse && (
        <dl className="m-0 mb-6 grid max-w-[960px] grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ["Unidades em estoque", number.format(warehouse.totalQuantity)],
            ["Reservado", number.format(warehouse.reserved)],
            ["SKUs", String(warehouse.skuCount)],
            ["Localizações", String(warehouse.locations.length)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4">
              <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</dt>
              <dd className="m-0 mt-1 text-xl font-bold text-foreground tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mb-4 max-w-[960px]"><StatusMessage status={notice} /></div>

      {state.phase === "loading" && <div className="h-96 max-w-[960px] animate-pulse rounded-xl bg-white/[0.035]" aria-label="Carregando" />}
      {state.phase === "error" && (
        <div role="alert" className="grid max-w-[960px] justify-items-start gap-4">
          <p className="m-0 text-sm text-destructive">{state.message}</p>
          <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>Tentar novamente</Button>
        </div>
      )}
      {state.phase === "ready" && (
        <div className="grid max-w-[960px] gap-6">
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
          {warehouse && <LocationsPanel warehouseId={warehouse.id} locations={warehouse.locations} onChange={setLocations} />}
        </div>
      )}
    </Layout>
  );
}
