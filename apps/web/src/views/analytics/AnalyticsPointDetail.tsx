import Link from "next/link";
import { PageHeader } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";
import type { InflectionPoint, SeriesPoint } from "@/entities/analytics";
import { ImpactBadge, SeverityBadge } from "./AnalyticsOverview";
import { formatChange, formatDate, formatMetric } from "./format";

const decimal = (value: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);

const windowStyle: Record<SeriesPoint["window"], { bar: string; label: string }> = {
  baseline: { bar: "bg-sky-500/60", label: "Referência (antes)" },
  current: { bar: "bg-primary", label: "Janela avaliada" },
  after: { bar: "bg-muted-foreground/40", label: "Semanas seguintes" },
};

function SeriesChart({ point }: { point: InflectionPoint }) {
  const series = point.series ?? [];
  if (!series.length) return null;
  const values = series.map((item) => item.value ?? 0);
  const max = Math.max(point.previous_value, point.current_value, ...values) || 1;
  const reference = (point.previous_value / max) * 100;
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-semibold">Semana a semana</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A linha tracejada é a mediana da referência ({formatMetric(point.previous_value, point.unit)}
        ). O ponto foi marcado porque a janela avaliada ficou longe dela por{" "}
        {point.evidence.currentWeeks ?? 3} semanas seguidas.
      </p>
      <div className="relative mt-6 flex h-48 items-end gap-1 border-b border-border">
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-sky-300/70"
          style={{ bottom: `${reference}%` }}
        />
        {series.map((item) => (
          <div
            key={item.periodStart}
            className="group relative flex h-full flex-1 flex-col justify-end"
            title={`${formatDate(item.periodStart)}: ${formatMetric(item.value, point.unit)} · ${item.orders} pedido(s)`}
          >
            {item.value === null ? (
              <span className="mb-1 text-center text-[10px] text-muted-foreground">s/d</span>
            ) : (
              <div
                className={`min-h-0.5 rounded-t ${windowStyle[item.window].bar}`}
                style={{ height: `${((item.value ?? 0) / max) * 100}%` }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1 text-[10px] text-muted-foreground">
        {series.map((item, index) => (
          <span key={item.periodStart} className="flex-1 truncate text-center">
            {index % 3 === 0
              ? new Intl.DateTimeFormat("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  timeZone: "UTC",
                }).format(new Date(item.periodStart))
              : ""}
          </span>
        ))}
      </div>
      <p className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        {Object.values(windowStyle).map((style) => (
          <span key={style.label}>
            <span className={`mr-1 inline-block size-2 rounded-full ${style.bar}`} />
            {style.label}
          </span>
        ))}
        <span>s/d = semana sem pedidos para calcular a métrica</span>
      </p>
    </section>
  );
}

function Term({ term, value, hint }: { term: string; value: React.ReactNode; hint: string }) {
  return (
    <div className="border-b border-border pb-3 last:border-0 last:pb-0">
      <div className="flex justify-between gap-3">
        <dt className="text-muted-foreground">{term}</dt>
        <dd className="text-right font-medium tabular-nums">{value}</dd>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function AnalyticsPointDetail({ point }: { point: InflectionPoint }) {
  const evidence = point.evidence ?? {};
  const supportOrders = (evidence.baselineOrders ?? 0) + (evidence.currentOrders ?? 0);
  return (
    <Layout title="Ponto de inflexão">
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          back={{ href: "/analytics", label: "Analytics" }}
          eyebrow={`Categoria ${point.product_category}${point.seller_state ? ` · Vendedor de ${point.seller_state}` : ""}`}
          title={point.metric_label}
          description={point.metric_description ?? undefined}
          badges={
            <>
              <ImpactBadge impact={point.impact} direction={point.direction} />
              <SeverityBadge severity={point.severity} />
            </>
          }
        />

        <section aria-label="Explicação" className="rounded-xl border border-border bg-card p-6">
          <p className="m-0">{point.explanation}</p>
          <p className="mt-4 break-all text-xs text-muted-foreground">
            Mudança a partir da semana de {formatDate(point.detected_at, "long")}
            {point.classification_label ? ` · ${point.classification_label}` : ""} · Vendedor{" "}
            <Link
              href={`/analytics?${new URLSearchParams({ seller_id: point.seller_id })}#points`}
              className="text-primary hover:underline"
            >
              {point.seller_id}
            </Link>{" "}
            · Fonte: {point.source}
          </p>
        </section>

        <section
          aria-label="Valores da mudança"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            ["Antes (mediana)", formatMetric(point.previous_value, point.unit)],
            ["Depois (mediana)", formatMetric(point.current_value, point.unit)],
            ["Variação", formatChange(point.absolute_change, point.unit)],
            [
              "Variação relativa",
              point.change_percentage === null
                ? "—"
                : `${point.direction === "DOWN" ? "−" : "+"}${decimal(point.change_percentage)}%`,
            ],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </section>

        {point.what_to_check && (
          <section
            className={`rounded-xl border p-5 ${
              point.impact === "NEGATIVE"
                ? "border-rose-500/30 bg-rose-500/5"
                : "border-emerald-500/30 bg-emerald-500/5"
            }`}
          >
            <h2 className="font-semibold">O que verificar</h2>
            <p className="mt-2 text-sm">{point.what_to_check}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {point.higher_is_better
                ? "Nesta métrica, valores maiores são melhores para o negócio."
                : "Nesta métrica, valores menores são melhores para o negócio."}
            </p>
          </section>
        )}

        <SeriesChart point={point} />

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">Quão forte é o sinal</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Term
                term="Score robusto"
                value={decimal(point.robust_score)}
                hint="Quantas vezes a mudança é maior que a oscilação normal da referência. Acima de 2,5 vira sinal."
              />
              <Term
                term="Confiança heurística"
                value={`${decimal(point.confidence * 100)}%`}
                hint="Índice para ordenar sinais (força + volume de pedidos). Não é probabilidade."
              />
              <Term
                term="Pedidos que sustentam o sinal"
                value={`${evidence.baselineOrders ?? "—"} + ${evidence.currentOrders ?? "—"}`}
                hint={
                  supportOrders < 20
                    ? "Pouco volume: poucos pedidos movem muito a métrica. Trate como indício."
                    : "Referência + janela avaliada. Mais pedidos tornam o sinal mais confiável."
                }
              />
            </dl>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">Valores usados no cálculo</h2>
            {[
              {
                label: `Referência · ${evidence.baselineWeeks ?? "—"} semanas`,
                values: evidence.baselineValues,
              },
              {
                label: `Janela avaliada · ${evidence.currentWeeks ?? "—"} semanas`,
                values: evidence.currentValues,
              },
            ].map(({ label, values }) => (
              <div key={label} className="mt-4">
                <h3 className="text-sm text-muted-foreground">{label}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {values?.length ? (
                    values.map((value, index) => (
                      <span
                        key={index}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm tabular-nums"
                      >
                        {formatMetric(value, point.unit)}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Sem valores</span>
                  )}
                </div>
              </div>
            ))}
            {evidence.limitation && (
              <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
                {evidence.limitation}
              </p>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
