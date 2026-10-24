"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState, type ReactNode } from "react";
import { auditLogApi, type AuditLog } from "@/entities/audit-log";
import {
  productApi,
  type Product,
  type ProductForecast,
  type ProductInventoryRow,
  type ProductLotRow,
  type ProductMovementRow,
  type ProductUnitRow,
} from "@/entities/product";
import { withSession } from "@/shared/auth/with-session";
import { PageHeader, secondaryActionClass } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";
import { productDetailPages } from "../model/pages";

export type ProductSection = keyof typeof productDetailPages;
type Page<T> = { items: T[]; page: number; pageSize: number; total: number };
type Data =
  | { kind: "inventory"; items: ProductInventoryRow[] }
  | { kind: "movements"; result: Page<ProductMovementRow> }
  | { kind: "lots"; result: Page<ProductLotRow> }
  | { kind: "barcodes" }
  | { kind: "units"; items: ProductUnitRow[] }
  | { kind: "forecast"; result: ProductForecast }
  | { kind: "auditLog"; result: Page<AuditLog> };

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 });
const shortDate = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const quantity = (value: number, unit: string) => `${number.format(value)} ${unit}`;
const date = (value: string | null) =>
  value ? shortDate.format(new Date(value.length === 10 ? `${value}T12:00:00` : value)) : "—";
const panel = "rounded-2xl border border-border bg-card p-5";
const movementLabels: Record<string, string> = {
  INBOUND: "Entrada",
  OUTBOUND: "Saída",
  TRANSFER: "Transferência",
  TRANSFER_OUT: "Transferência enviada",
  TRANSFER_IN: "Transferência recebida",
  ADJUSTMENT: "Ajuste",
  CYCLE_COUNT: "Contagem",
  RESERVATION: "Reserva",
  RELEASE: "Liberação",
  RETURN: "Devolução",
  SCRAP: "Descarte",
};
const lotLabels: Record<string, string> = {
  AVAILABLE: "Disponível",
  QUARANTINE: "Quarentena",
  BLOCKED: "Bloqueado",
  EXPIRED: "Vencido",
  CONSUMED: "Consumido",
};

async function load(id: string, section: ProductSection, page: number): Promise<Data> {
  switch (section) {
    case "inventory":
      return { kind: section, items: await productApi.inventory(id) };
    case "movements":
      return { kind: section, result: await productApi.movements(id, page) };
    case "lots":
      return { kind: section, result: await productApi.lots(id, page) };
    case "barcodes":
      return { kind: section };
    case "units":
      return { kind: section, items: await productApi.units(id) };
    case "forecast":
      return { kind: section, result: await productApi.forecast(id) };
    case "auditLog":
      return {
        kind: section,
        result: await auditLogApi.list({ entityType: "Product", entityId: id, page, pageSize: 20 }),
      };
  }
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div className={`${panel} py-12 text-center text-sm text-muted-foreground`}>{children}</div>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function Pager({
  result,
  onChange,
}: {
  result: { page: number; pageSize: number; total: number };
  onChange: (page: number) => void;
}) {
  const lastPage = Math.ceil(result.total / result.pageSize);
  if (lastPage < 2) return null;
  return (
    <div className="mt-5 flex items-center justify-end gap-3 text-sm">
      <button
        type="button"
        className={secondaryActionClass}
        disabled={result.page <= 1}
        onClick={() => onChange(result.page - 1)}
      >
        Anterior
      </button>
      <span>
        Página {result.page} de {lastPage}
      </span>
      <button
        type="button"
        className={secondaryActionClass}
        disabled={result.page >= lastPage}
        onClick={() => onChange(result.page + 1)}
      >
        Próxima
      </button>
    </div>
  );
}

function Content({
  data,
  product,
  onPage,
}: {
  data: Data;
  product: Product;
  onPage: (page: number) => void;
}) {
  switch (data.kind) {
    case "inventory": {
      const rows = data.items;
      const total = rows.reduce((sum, row) => sum + row.quantity, 0);
      return (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <dl className={panel}>
              <Field label="Saldo físico" value={quantity(total, product.unit)} />
            </dl>
            <dl className={panel}>
              <Field
                label="Disponível"
                value={quantity(
                  rows.reduce((sum, row) => sum + row.available, 0),
                  product.unit,
                )}
              />
            </dl>
            <dl className={panel}>
              <Field label="Armazéns" value={rows.length} />
            </dl>
          </div>
          {rows.length ? (
            <div className="grid gap-3">
              {rows.map((row) => (
                <article key={row.id} className={panel}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/warehouses/${row.warehouseId}` as Route}
                      className="font-semibold text-foreground hover:underline"
                    >
                      {row.warehouseName}
                    </Link>
                    <span className="font-mono text-xs text-muted-foreground">
                      {row.warehouseCode}
                    </span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Field label="Saldo" value={quantity(row.quantity, product.unit)} />
                    <Field label="Disponível" value={quantity(row.available, product.unit)} />
                    <Field label="Reservado" value={quantity(row.reserved, product.unit)} />
                    <Field label="Em trânsito" value={quantity(row.incoming, product.unit)} />
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <Empty>Este produto ainda não possui saldo em armazéns.</Empty>
          )}
        </>
      );
    }
    case "movements":
      return data.result.items.length ? (
        <>
          <div className="grid gap-3">
            {data.result.items.map((row) => (
              <article key={row.id} className={panel}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sm">{movementLabels[row.type] ?? row.type}</strong>
                  <time className="text-xs text-muted-foreground">
                    {dateTime.format(new Date(row.occurredAt))}
                  </time>
                </div>
                <p className="mb-0 mt-2 text-sm">
                  {quantity(row.quantity, product.unit)} · {row.warehouseName}
                </p>
                <p className="mb-0 mt-1 text-xs text-muted-foreground">
                  Saldo: {quantity(row.previousQuantity, product.unit)} →{" "}
                  {quantity(row.resultingQuantity, product.unit)}
                  {row.referenceId
                    ? ` · ${row.referenceType ?? "Referência"}: ${row.referenceId}`
                    : ""}
                </p>
                {row.notes && (
                  <p className="mb-0 mt-2 text-sm text-muted-foreground">{row.notes}</p>
                )}
              </article>
            ))}
          </div>
          <Pager result={data.result} onChange={onPage} />
        </>
      ) : (
        <Empty>Nenhuma movimentação registrada para este produto.</Empty>
      );
    case "lots":
      return data.result.items.length ? (
        <>
          <div className="grid gap-3">
            {data.result.items.map((row) => (
              <article key={row.id} className={panel}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>{row.serialNumber ?? row.lotNumber}</strong>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs">
                    {lotLabels[row.status] ?? row.status}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Field label="Lote" value={row.lotNumber} />
                  <Field label="Validade" value={date(row.expiresAt)} />
                  <Field
                    label="Saldo por localização"
                    value={quantity(row.quantity, product.unit)}
                  />
                  <Field label="Reservado" value={quantity(row.reserved, product.unit)} />
                  <Field label="Fornecedor" value={row.supplierRef ?? "—"} />
                  <Field label="Recebido" value={date(row.receivedAt)} />
                </dl>
              </article>
            ))}
          </div>
          <Pager result={data.result} onChange={onPage} />
        </>
      ) : (
        <Empty>Nenhum lote ou número de série registrado para este produto.</Empty>
      );
    case "barcodes":
      return product.barcodes.length ? (
        <div className="grid gap-3">
          {product.barcodes.map((row) => (
            <article key={row.id} className={panel}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="break-all font-mono">{row.code}</strong>
                {row.isPrimary && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                    Principal
                  </span>
                )}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <Field label="Tipo" value={row.type.replaceAll("_", " ")} />
                <Field label="Equivalência" value={quantity(row.quantity, product.unit)} />
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <Empty>Nenhum código de barras cadastrado. Adicione um na edição do produto.</Empty>
      );
    case "units":
      return (
        <>
          <div className={`${panel} mb-4`}>
            <h2 className="m-0 text-sm font-semibold">Unidade base</h2>
            <p className="mb-0 mt-2 text-sm text-muted-foreground">
              1 {product.unit} é a referência para saldos, movimentos e conversões.
            </p>
          </div>
          {data.items.length ? (
            <div className="grid gap-3">
              {data.items.map((row) => (
                <article key={row.unitId} className={panel}>
                  <strong>
                    {row.name} ({row.code})
                  </strong>
                  <p className="mb-0 mt-2 text-sm">
                    1 {row.code} = {number.format(row.factor)} {product.unit}
                  </p>
                  <p className="mb-0 mt-1 text-xs text-muted-foreground">
                    Precisão: {row.precision} casas decimais
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <Empty>Nenhuma conversão adicional cadastrada para este produto.</Empty>
          )}
        </>
      );
    case "forecast": {
      const forecast = data.result;
      const max = Math.max(1, ...forecast.weeks.map((week) => week.quantity));
      return (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <dl className={panel}>
              <Field
                label="Estimativa para a próxima semana"
                value={
                  forecast.forecastNextWeek == null
                    ? "Dados insuficientes"
                    : quantity(forecast.forecastNextWeek, product.unit)
                }
              />
            </dl>
            <dl className={panel}>
              <Field
                label="Ponto de reposição"
                value={
                  product.reorderPoint == null
                    ? "Não definido"
                    : quantity(product.reorderPoint, product.unit)
                }
              />
            </dl>
          </div>
          <section className={panel}>
            <h2 className="m-0 text-base font-semibold">Saídas nas últimas 12 semanas completas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {forecast.method} Esta estimativa não considera sazonalidade, pedidos futuros ou
              estoque disponível.
            </p>
            {forecast.forecastNextWeek == null ? (
              <p className="mt-6 text-sm text-muted-foreground">
                Nenhuma saída registrada neste período. Ainda não há base para estimar a demanda.
              </p>
            ) : (
              <>
                <div
                  className="mt-6 grid grid-cols-12 items-end gap-1"
                  role="img"
                  aria-label="Saídas de estoque por semana"
                >
                  {forecast.weeks.map((week) => (
                    <div
                      key={week.week}
                      className="min-w-0 text-center"
                      title={`${date(week.week)}: ${quantity(week.quantity, product.unit)}`}
                    >
                      <div className="flex h-40 items-end rounded bg-muted/50">
                        <div
                          className="w-full rounded-t bg-primary/70"
                          style={{
                            height: `${Math.max(week.quantity ? 3 : 0, (week.quantity / max) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="mt-2 block truncate text-[10px] text-muted-foreground">
                        {date(week.week).slice(0, 5)}
                      </span>
                    </div>
                  ))}
                </div>
                <ul className="sr-only">
                  {forecast.weeks.map((week) => (
                    <li key={week.week}>
                      {date(week.week)}: {quantity(week.quantity, product.unit)}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </>
      );
    }
    case "auditLog":
      return data.result.items.length ? (
        <>
          <div className="grid gap-3">
            {data.result.items.map((row) => (
              <article key={row.id} className={panel}>
                <div className="flex flex-wrap justify-between gap-2">
                  <strong className="text-sm">{row.eventName}</strong>
                  <time className="text-xs text-muted-foreground">
                    {dateTime.format(new Date(row.occurredAt))}
                  </time>
                </div>
                <p className="mb-0 mt-2 text-sm text-muted-foreground">
                  {row.action} · {row.actorEmail ?? row.actorId ?? "Sistema"}
                </p>
                {row.correlationId && (
                  <p className="mb-0 mt-1 break-all font-mono text-xs text-muted-foreground">
                    Correlação: {row.correlationId}
                  </p>
                )}
              </article>
            ))}
          </div>
          <Pager result={data.result} onChange={onPage} />
        </>
      ) : (
        <Empty>Não há eventos de auditoria vinculados diretamente a este produto.</Empty>
      );
  }
}

export function ProductSectionPage({
  productId,
  section,
}: {
  productId: string;
  section: ProductSection;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const config = productDetailPages[section](productId);

  useEffect(() => {
    setPage(1);
  }, [productId, section]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    withSession(Promise.all([productApi.get(productId), load(productId, section, page)]))
      .then(([result, sectionData]) => {
        if (!cancelled) {
          setProduct(result);
          setData(sectionData);
          setLoading(false);
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(
            reason instanceof Error ? reason.message : "Não foi possível carregar esta página.",
          );
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [productId, section, page, attempt]);

  return (
    <Layout title={config.title}>
      <div className="pb-10">
        <PageHeader
          back={config.back}
          title={config.title}
          description={product ? `${product.name} · ${product.sku}` : config.description}
          actions={
            section === "barcodes" &&
            product && (
              <Link href={`/products/${productId}/edit` as Route} className={secondaryActionClass}>
                Editar códigos
              </Link>
            )
          }
        />
        {loading ? (
          <div role="status" className={panel}>
            Carregando dados do produto…
          </div>
        ) : error ? (
          <div role="alert" className={panel}>
            <p className="mt-0 font-semibold">Não foi possível carregar.</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              type="button"
              className={secondaryActionClass}
              onClick={() => setAttempt((value) => value + 1)}
            >
              Tentar novamente
            </button>
          </div>
        ) : product && data ? (
          <Content data={data} product={product} onPage={setPage} />
        ) : null}
      </div>
    </Layout>
  );
}
