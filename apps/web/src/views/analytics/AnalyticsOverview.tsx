import Link from "next/link";
import { PageHeader } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/kit/select";
import type {
  AnalyticsCatalog,
  AnalyticsSummary,
  Impact,
  InflectionPointsResponse,
  InflectionPoint,
} from "@/entities/analytics";
import { formatDate, formatMetric, formatNumber, impactLabel } from "./format";

const severityLabel: Record<string, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

export function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    LOW: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    MEDIUM: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    HIGH: "border-orange-500/30 bg-orange-500/10 text-orange-300",
    CRITICAL: "border-red-500/30 bg-red-500/10 text-red-300",
  };
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${colors[severity] ?? "border-border text-muted-foreground"}`}
    >
      {severityLabel[severity] ?? severity}
    </span>
  );
}

export function ImpactBadge({ impact, direction }: { impact: Impact; direction?: string }) {
  const colors: Record<Impact, string> = {
    POSITIVE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    NEGATIVE: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    NEUTRAL: "border-border text-muted-foreground",
  };
  const arrow = direction === "UP" ? "↑ " : direction === "DOWN" ? "↓ " : "";
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${colors[impact]}`}>
      {arrow}
      {impactLabel[impact]}
    </span>
  );
}

export function AnalyticsUnavailable() {
  return (
    <Layout title="Analytics">
      <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
        <h1>Analytics indisponível</h1>
        <p className="mt-2 text-muted-foreground">
          Inicie o serviço de analytics e confira se o pipeline de dados foi executado.
        </p>
      </div>
    </Layout>
  );
}

function PointRow({ point }: { point: InflectionPoint }) {
  return (
    <Link
      href={`/analytics/inflection-points/${encodeURIComponent(point.id)}`}
      className="block rounded-xl border border-border bg-card p-4 transition hover:border-primary/50 hover:bg-card-hover"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">
            Semana de {formatDate(point.detected_at)} · {point.product_category}
          </p>
          <h3 className="mt-1 font-semibold">{point.metric_label}</h3>
        </div>
        <div className="flex gap-2">
          <ImpactBadge impact={point.impact} direction={point.direction} />
          <SeverityBadge severity={point.severity} />
        </div>
      </div>
      <p className="mt-3 text-lg font-semibold tabular-nums">
        {formatMetric(point.previous_value, point.unit)}
        <span className="mx-2 text-muted-foreground">→</span>
        {formatMetric(point.current_value, point.unit)}
      </p>
      <p className="mt-1 truncate text-xs text-muted-foreground">Vendedor {point.seller_id}</p>
      <p className="mt-3 text-xs text-primary">Ver contexto e o que verificar →</p>
    </Link>
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  options: [string, string][];
}) {
  return (
    <label className="text-sm">
      {label}
      <Select name={name} defaultValue={value ?? "ALL"}>
        <SelectTrigger className="mt-1 w-full data-[size=default]:h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todas</SelectItem>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

const HOW_IT_WORKS = [
  {
    title: "1. Observa",
    text: "Agrupa os pedidos por vendedor + categoria + semana e calcula vendas, receita, cancelamento, atraso, prazo e avaliação.",
  },
  {
    title: "2. Compara",
    text: "Para cada semana, compara a mediana das 8 semanas anteriores (referência) com a das 3 seguintes. Mediana ignora semanas atípicas isoladas.",
  },
  {
    title: "3. Sinaliza",
    text: "Só vira ponto de inflexão se a mudança for grande, fora da variação normal do vendedor e se mantiver por 3 semanas — não é um pico de um dia.",
  },
];

export function AnalyticsOverview({
  summary,
  points,
  catalog,
  filters,
}: {
  summary: AnalyticsSummary;
  points: InflectionPointsResponse;
  catalog: AnalyticsCatalog;
  filters: {
    seller_id?: string;
    metric?: string;
    severity?: string;
    classification?: string;
    impact?: string;
    offset: number;
  };
}) {
  const baseParams = new URLSearchParams();
  for (const key of ["seller_id", "metric", "severity", "classification", "impact"] as const)
    if (filters[key]) baseParams.set(key, filters[key]!);
  const nextParams = new URLSearchParams(baseParams);
  nextParams.set("offset", String(filters.offset + points.limit));
  const prevParams = new URLSearchParams(baseParams);
  prevParams.set("offset", String(Math.max(0, filters.offset - points.limit)));
  const negativeParams = new URLSearchParams({ impact: "NEGATIVE" });
  const maxMetric = Math.max(1, ...summary.byMetric.map((item) => item.total));

  return (
    <Layout title="Analytics">
      <div className="space-y-7">
        <PageHeader
          eyebrow="Inteligência de negócios · Laboratório com dados da Olist"
          title="O que mudou de patamar e precisa de atenção"
          description={
            <>
              O estoque e a auditoria registram <strong className="font-semibold text-foreground">o que aconteceu</strong>. Esta área
              responde <strong className="font-semibold text-foreground">o que mudou</strong>: vendedores e categorias cujas vendas,
              cancelamentos, atrasos ou avaliações saíram do comportamento habitual e não voltaram.
              Uma queda persistente de pedidos pode indicar ruptura de estoque; uma alta pede
              reposição maior; mais atraso costuma anteceder avaliações piores.
            </>
          }
        />

        <section aria-label="Como funciona" className="grid gap-3 md:grid-cols-3">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.title} className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold">{step.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </section>

        <section aria-label="Resumo" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [
              "Observações semanais",
              summary.observations,
              `${formatNumber(summary.observedSellers)} vendedores, de ${formatDate(summary.observationPeriod.start)} a ${formatDate(summary.observationPeriod.end)}`,
            ],
            [
              "Pontos de inflexão",
              summary.inflectionPoints,
              "Mudanças persistentes encontradas nessas observações",
            ],
            [
              "Pioraram",
              summary.byImpact.NEGATIVE ?? 0,
              "Mudanças ruins para o negócio — comece por aqui",
            ],
            [
              "Melhoraram",
              summary.byImpact.POSITIVE ?? 0,
              "Crescimento ou melhora de serviço; confira se o estoque acompanha",
            ],
          ].map(([label, value, hint]) => (
            <div key={label} className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {formatNumber(Number(value))}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">Sinais por métrica</h2>
              <Link
                href={`/analytics?${negativeParams}#points`}
                className="text-sm text-primary hover:underline"
              >
                Ver só o que piorou →
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {summary.byMetric.map((item) => (
                <li key={item.metric}>
                  <Link
                    href={`/analytics?${new URLSearchParams({ metric: item.metric })}#points`}
                    className="block rounded-lg p-1 hover:bg-card-hover"
                  >
                    <div className="flex justify-between gap-3 text-sm">
                      <span>{item.label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatNumber(item.total)}
                      </span>
                    </div>
                    <div
                      className="mt-1 flex h-2 overflow-hidden rounded-full bg-background"
                      style={{ width: `${(item.total / maxMetric) * 100}%` }}
                      aria-label={`${item.positive} melhoraram, ${item.negative} pioraram`}
                    >
                      <span className="bg-emerald-500/70" style={{ flex: item.positive }} />
                      <span className="bg-rose-500/70" style={{ flex: item.negative }} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex gap-4 text-xs text-muted-foreground">
              <span>
                <span className="mr-1 inline-block size-2 rounded-full bg-emerald-500/70" />
                Melhorou
              </span>
              <span>
                <span className="mr-1 inline-block size-2 rounded-full bg-rose-500/70" />
                Piorou
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Por severidade</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Combina o tamanho da mudança com o quanto ela foge da variação normal daquele
              vendedor. Não considera o volume de pedidos.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((level) => (
                <div
                  key={level}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <SeverityBadge severity={level} />
                  <strong className="tabular-nums">
                    {formatNumber(summary.bySeverity[level] ?? 0)}
                  </strong>
                </div>
              ))}
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Vendedores com sinal</dt>
                <dd className="tabular-nums">{formatNumber(summary.sellers)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Categorias com sinal</dt>
                <dd className="tabular-nums">{formatNumber(summary.categories)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Detecções</dt>
                <dd>
                  {formatDate(summary.firstDetection)} – {formatDate(summary.lastDetection)}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section id="points" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Pontos de inflexão</h2>
            <p className="text-sm text-muted-foreground">
              Cada cartão é uma métrica de um vendedor numa categoria que mudou de patamar. Abra
              para ver a série semanal e o que verificar.
            </p>
          </div>
          <form
            className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-3 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]"
            action="/analytics"
            method="get"
          >
            <label className="text-sm">
              Vendedor
              <input
                name="seller_id"
                defaultValue={filters.seller_id}
                placeholder="ID do vendedor"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <FilterSelect
              name="metric"
              label="Métrica"
              value={filters.metric}
              options={catalog.metrics.map((metric) => [metric.name, metric.label])}
            />
            <FilterSelect
              name="impact"
              label="Impacto"
              value={filters.impact}
              options={[
                ["NEGATIVE", "Piorou"],
                ["POSITIVE", "Melhorou"],
              ]}
            />
            <FilterSelect
              name="classification"
              label="Tipo"
              value={filters.classification}
              options={Object.entries(catalog.classifications)}
            />
            <FilterSelect
              name="severity"
              label="Severidade"
              value={filters.severity}
              options={["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((level) => [
                level,
                severityLabel[level],
              ])}
            />
            <button
              type="submit"
              className="self-end rounded-lg bg-primary px-5 py-2 text-primary-foreground"
            >
              Filtrar
            </button>
          </form>
          <p className="text-sm text-muted-foreground">
            {points.count
              ? `${filters.offset + 1}–${filters.offset + points.count} de ${formatNumber(points.total)} resultado(s)`
              : "0 resultados"}
          </p>
          {points.items.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {points.items.map((point) => (
                <PointRow key={point.id} point={point} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              Nenhum ponto encontrado para estes filtros.
            </div>
          )}
          <nav aria-label="Paginação" className="flex justify-end gap-3">
            {filters.offset > 0 && (
              <Link
                className="rounded-lg border border-border px-4 py-2"
                href={`/analytics?${prevParams}#points`}
              >
                Anterior
              </Link>
            )}
            {filters.offset + points.count < points.total && (
              <Link
                className="rounded-lg border border-border px-4 py-2"
                href={`/analytics?${nextParams}#points`}
              >
                Próxima
              </Link>
            )}
          </nav>
          <p className="text-xs text-muted-foreground">
            Os sinais são associações observacionais: mostram <em>quando</em> algo mudou, não{" "}
            <em>por quê</em>. Nos dados da Olist não há saldo de estoque, então nenhuma ruptura é
            confirmada aqui.
          </p>
        </section>
      </div>
    </Layout>
  );
}
