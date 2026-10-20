import Link from "next/link";
import { Layout } from "@/widgets/layout";
import type { InflectionPoint } from "@/entities/analytics/api";
import { SeverityBadge } from "./AnalyticsOverview";

const format = (value: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);

export function AnalyticsPointDetail({ point }: { point: InflectionPoint }) {
  const evidence = point.evidence ?? {};
  return (
    <Layout title="Ponto de inflexão">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/analytics" className="text-sm text-primary hover:underline">
          ← Voltar para analytics
        </Link>
        <header className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                {point.seller_id} · {point.product_category}
              </p>
              <h1 className="mt-2 text-2xl font-semibold">{point.metric}</h1>
            </div>
            <SeverityBadge severity={point.severity} />
          </div>
          <p className="mt-4 text-muted-foreground">{point.explanation}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            Detectado em{" "}
            {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(
              new Date(point.detected_at),
            )}{" "}
            · Fonte: {point.source}
          </p>
        </header>
        <section
          aria-label="Valores da mudança"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            ["Valor anterior", format(point.previous_value)],
            ["Valor atual", format(point.current_value)],
            ["Variação absoluta", format(point.absolute_change)],
            [
              "Variação percentual",
              point.change_percentage === null ? "—" : `${format(point.change_percentage)}%`,
            ],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </section>
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">Detecção</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ["Classificação", point.classification ?? "—"],
                ["Score robusto", format(point.robust_score)],
                ["Confiança heurística", `${format(point.confidence * 100)}%`],
                ["Semanas de referência", evidence.baselineWeeks ?? "—"],
                ["Semanas atuais", evidence.currentWeeks ?? "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">Suporte do sinal</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Pedidos de referência</dt>
                <dd>{evidence.baselineOrders ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Pedidos atuais</dt>
                <dd>{evidence.currentOrders ?? "—"}</dd>
              </div>
            </dl>
            <p className="mt-5 text-sm text-muted-foreground">{evidence.confidenceMeaning}</p>
          </div>
        </section>
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold">Evidências por janela</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              { label: "Referência", values: evidence.baselineValues },
              { label: "Atual", values: evidence.currentValues },
            ].map(({ label, values }) => (
              <div key={label}>
                <h3 className="text-sm text-muted-foreground">{label}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {values?.length ? (
                    values.map((value, index) => (
                      <span
                        key={index}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm tabular-nums"
                      >
                        {format(value)}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Sem valores</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {evidence.limitation && (
            <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
              {evidence.limitation}
            </p>
          )}
        </section>
      </div>
    </Layout>
  );
}
