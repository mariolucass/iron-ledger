"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { warehouseApi, warehouseTypeLabel, type WarehouseDetail } from "@/entities/warehouse";
import { withSession } from "@/shared/auth/with-session";
import { PageHeader, primaryActionClass, secondaryActionClass } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 });
const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });
const sections = [
  ["inventory", "Estoque"],
  ["locations", "Localizações"],
  ["movements", "Movimentações"],
  ["reservations", "Reservas"],
  ["transfers", "Transferências"],
  ["counts", "Contagens"],
  ["access", "Acessos"],
  ["settings", "Parâmetros"],
  ["audit-log", "Auditoria"],
] as const;

export function WarehouseOverviewPage({ warehouseId }: { warehouseId: string }) {
  const [warehouse, setWarehouse] = useState<WarehouseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    withSession(warehouseApi.get(warehouseId))
      .then((result) => {
        if (!cancelled) {
          setWarehouse(result);
          setLoading(false);
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(
            reason instanceof Error ? reason.message : "Não foi possível carregar o armazém.",
          );
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [warehouseId, attempt]);

  return (
    <Layout title={warehouse?.name ?? "Armazém"}>
      <div className="pb-10">
        <PageHeader
          back={{ href: "/warehouses", label: "Armazéns" }}
          title={warehouse?.name ?? "Armazém"}
          description={
            warehouse
              ? `${warehouse.code} · ${warehouseTypeLabel[warehouse.type]} · ${warehouse.isActive ? "Ativo" : "Inativo"}`
              : "Detalhes do armazém"
          }
          actions={
            warehouse && (
              <Link
                href={`/warehouses/${warehouseId}/edit` as Route}
                className={primaryActionClass}
              >
                Editar armazém
              </Link>
            )
          }
        />
        {loading ? (
          <div role="status" className="rounded-2xl border border-border bg-card p-6">
            Carregando armazém…
          </div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-border bg-card p-6">
            <p>{error}</p>
            <button
              type="button"
              className={secondaryActionClass}
              onClick={() => setAttempt((value) => value + 1)}
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          warehouse && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["SKUs com saldo", number.format(warehouse.skuCount)],
                  ["Saldo físico", number.format(warehouse.totalQuantity)],
                  ["Reservado", number.format(warehouse.reserved)],
                  ["Localizações", number.format(warehouse.locations.length)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-border bg-card p-5">
                    <p className="m-0 text-xs text-muted-foreground">{label}</p>
                    <p className="mb-0 mt-2 text-2xl font-semibold tabular-nums">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <section className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="m-0 text-base font-semibold">Instalação</h2>
                  <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Endereço</dt>
                      <dd className="mt-1 font-medium">
                        {warehouse.address ?? warehouse.addressLine ?? "Não informado"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Cidade / UF</dt>
                      <dd className="mt-1 font-medium">
                        {[warehouse.city, warehouse.state].filter(Boolean).join(" / ") ||
                          "Não informado"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Fuso horário</dt>
                      <dd className="mt-1 font-medium">{warehouse.timezone}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Atualizado em</dt>
                      <dd className="mt-1 font-medium">
                        {date.format(new Date(warehouse.updatedAt))}
                      </dd>
                    </div>
                  </dl>
                </section>
                <section className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="m-0 text-base font-semibold">Estrutura</h2>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {warehouse.locations.length
                      ? `${warehouse.locations.length} localizações cadastradas.`
                      : "Nenhuma localização cadastrada."}
                  </p>
                  <Link
                    href={`/warehouses/${warehouseId}/locations` as Route}
                    className={secondaryActionClass}
                  >
                    Ver localizações
                  </Link>
                </section>
              </div>
              <nav
                aria-label="Explorar armazém"
                className="mt-5 rounded-2xl border border-border bg-card p-5"
              >
                <h2 className="m-0 text-base font-semibold">Explorar armazém</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {sections.map(([path, label]) => (
                    <Link
                      key={path}
                      href={`/warehouses/${warehouseId}/${path}` as Route}
                      className={secondaryActionClass}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </nav>
            </>
          )
        )}
      </div>
    </Layout>
  );
}
