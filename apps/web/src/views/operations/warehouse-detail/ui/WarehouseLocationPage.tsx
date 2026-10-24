"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { warehouseApi, type WarehouseLocationDetail } from "@/entities/warehouse";
import { withSession } from "@/shared/auth/with-session";
import { PageHeader, secondaryActionClass } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";

const number = (value: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(value);

export function WarehouseLocationPage({
  warehouseId,
  locationId,
}: {
  warehouseId: string;
  locationId: string;
}) {
  const [location, setLocation] = useState<WarehouseLocationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    withSession(warehouseApi.location(warehouseId, locationId))
      .then((result) => {
        if (!cancelled) {
          setLocation(result);
          setLoading(false);
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(
            reason instanceof Error ? reason.message : "Não foi possível carregar a localização.",
          );
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [warehouseId, locationId, attempt]);
  return (
    <Layout title={location?.name ?? "Localização"}>
      <div className="pb-10">
        <PageHeader
          back={{ href: `/warehouses/${warehouseId}/locations` as Route, label: "Localizações" }}
          title={location?.name ?? location?.code ?? "Localização"}
          description={location ? `${location.code} · ${location.path}` : "Detalhes da localização"}
        />
        {loading ? (
          <p role="status" className="rounded-2xl border border-border bg-card p-6">
            Carregando…
          </p>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-border bg-card p-6">
            <p>{error}</p>
            <button
              type="button"
              className={secondaryActionClass}
              onClick={() => setAttempt((current) => current + 1)}
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          location && (
            <>
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="m-0 text-base font-semibold">Características</h2>
                <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Tipo", location.type],
                    ["Estado", location.isActive ? "Ativa" : "Inativa"],
                    ["Separação", location.isPickable ? "Permitida" : "Não permitida"],
                    ["Recebimento", location.isReceivable ? "Permitido" : "Não permitido"],
                    [
                      "Peso máximo",
                      location.maxWeightKg == null ? "—" : `${number(location.maxWeightKg)} kg`,
                    ],
                    [
                      "Volume máximo",
                      location.maxVolumeM3 == null ? "—" : `${number(location.maxVolumeM3)} m³`,
                    ],
                    [
                      "Sequência de separação",
                      location.pickSequence == null ? "—" : number(location.pickSequence),
                    ],
                  ].map(([label, field]) => (
                    <div key={label}>
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="mt-1 font-medium">{field}</dd>
                    </div>
                  ))}
                </dl>
              </section>
              <section className="mt-5">
                <h2 className="text-base font-semibold">Produtos nesta localização</h2>
                {location.stocks.length === 0 ? (
                  <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                    Nenhum produto com saldo nesta localização.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {location.stocks.map((stock) => (
                      <article
                        key={stock.id}
                        className="rounded-2xl border border-border bg-card p-5"
                      >
                        <Link
                          href={`/products/${stock.productId}` as Route}
                          className="font-semibold hover:underline"
                        >
                          {stock.productName}
                        </Link>
                        <p className="mb-0 mt-1 text-sm text-muted-foreground">{stock.sku}</p>
                        <p className="mb-0 mt-3 text-sm">
                          Saldo: {number(stock.quantity)} {stock.unit} · Reservado:{" "}
                          {number(stock.reserved)} {stock.unit}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )
        )}
      </div>
    </Layout>
  );
}
