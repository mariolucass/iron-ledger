import Link from "next/link";
import { Layout } from "@/widgets/layout";
import type {
  AnalyticsSummary,
  InflectionPointsResponse,
  InflectionPoint,
} from "@/entities/analytics/api";

const number = (value: number) => new Intl.NumberFormat("pt-BR").format(value);
const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "UTC" }).format(
        new Date(value),
      )
    : "—";
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
        <div>
          <p className="text-sm text-muted-foreground">
            {date(point.detected_at)} · {point.seller_id}
          </p>
          <h3 className="mt-1 font-semibold">
            {point.product_category} · {point.metric}
          </h3>
        </div>
        <SeverityBadge severity={point.severity} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{point.explanation}</p>
      <p className="mt-3 text-xs text-primary">Ver evidências →</p>
    </Link>
  );
}

export function AnalyticsOverview({
  summary,
  points,
  filters,
}: {
  summary: AnalyticsSummary;
  points: InflectionPointsResponse;
  filters: { seller_id?: string; metric?: string; severity?: string; offset: number };
}) {
  const baseParams = new URLSearchParams();
  for (const key of ["seller_id", "metric", "severity"] as const)
    if (filters[key]) baseParams.set(key, filters[key]!);
  const nextParams = new URLSearchParams(baseParams);
  nextParams.set("offset", String(filters.offset + points.limit));
  const prevParams = new URLSearchParams(baseParams);
  prevParams.set("offset", String(Math.max(0, filters.offset - points.limit)));
  return (
    <Layout title="Analytics">
      <div className="space-y-7">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Inteligência de negócios · Olist
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Resultado das análises</h1>
          <p className="mt-2 text-muted-foreground">
            Observações semanais e sinais de mudança detectados pelo pipeline. Os sinais são
            associações observacionais.
          </p>
        </header>
        <section aria-label="Resumo" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Observações", summary.observations],
            ["Pontos de inflexão", summary.inflectionPoints],
            ["Vendedores", summary.sellers],
            ["Categorias", summary.categories],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{number(Number(value))}</p>
            </div>
          ))}
        </section>
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Por severidade</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((level) => (
                <div
                  key={level}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <SeverityBadge severity={level} />
                  <strong className="tabular-nums">{number(summary.bySeverity[level] ?? 0)}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Cobertura das detecções</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Primeira</dt>
                <dd>{date(summary.firstDetection)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Mais recente</dt>
                <dd>{date(summary.lastDetection)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Método</dt>
                <dd className="text-right">Mediana, MAD e janela persistente</dd>
              </div>
            </dl>
          </div>
        </section>
        <section id="points" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Pontos de inflexão</h2>
            <p className="text-sm text-muted-foreground">
              Filtre os resultados e abra um ponto para ver valores e evidências.
            </p>
          </div>
          <form
            className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_1fr_1fr_auto]"
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
            <label className="text-sm">
              Métrica
              <input
                name="metric"
                defaultValue={filters.metric}
                placeholder="Nome da métrica"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Severidade
              <select
                name="severity"
                defaultValue={filters.severity ?? ""}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              >
                <option value="">Todas</option>
                {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((level) => (
                  <option key={level} value={level}>
                    {severityLabel[level]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="self-end rounded-lg bg-primary px-5 py-2 text-primary-foreground"
            >
              Filtrar
            </button>
          </form>
          <p className="text-sm text-muted-foreground">
            {points.count} resultado(s) nesta página · {filters.offset + 1}–
            {filters.offset + points.count}
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
            {points.count === points.limit && (
              <Link
                className="rounded-lg border border-border px-4 py-2"
                href={`/analytics?${nextParams}#points`}
              >
                Próxima
              </Link>
            )}
          </nav>
        </section>
      </div>
    </Layout>
  );
}
