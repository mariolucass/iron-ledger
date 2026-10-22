"use client";

import Link from "next/link";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  AccuracyStatus,
  ForecastAccuracyDetail,
  ForecastAccuracyItem,
  ForecastAccuracyResponse,
} from "@/entities/analytics";
import { colors as theme } from "@/shared/config/tokens";

const percent = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });
const signedPercent = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 0,
  signDisplay: "exceptZero",
});

const statusStyle: Record<AccuracyStatus, { label: string; color: string; bg: string }> = {
  GOOD: { label: "Boa", color: theme.accent, bg: theme.accentGlow },
  FAIR: { label: "Regular", color: theme.warning, bg: theme.warningGlow },
  POOR: { label: "Baixa", color: theme.danger, bg: theme.dangerGlow },
  UNKNOWN: { label: "Sem venda", color: theme.textSecondary, bg: theme.surfaceHover },
};

const mono = { fontFamily: "var(--font-jetbrains-mono)" } as const;
const card = {
  background: theme.surface,
  border: `1px solid ${theme.border}`,
  borderRadius: 12,
} as const;

const productLabel = (item: Pick<ForecastAccuracyItem, "category" | "product_id">) =>
  `${item.category.replaceAll("_", " ")} · ${item.product_id.slice(0, 8)}`;

const shortDate = (value: string) => value.slice(5).split("-").reverse().join("/");

/** Texto do viés: diz para que lado o modelo erra, não só o tamanho do erro. */
function biasText(bias: number | null) {
  if (bias === null) return "—";
  if (Math.abs(bias) < 0.05) return "Sem viés";
  return `${bias > 0 ? "Superestima" : "Subestima"} ${percent.format(Math.abs(bias))}`;
}

function StatusPill({ status }: { status: AccuracyStatus }) {
  const style = statusStyle[status];
  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        borderRadius: 999,
        padding: "2px 10px",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}
    >
      {style.label}
    </span>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div
      style={{
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: 8,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: theme.textSecondary,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{ ...mono, fontSize: 20, fontWeight: 700, color: theme.textPrimary, marginTop: 4 }}
      >
        {value}
      </div>
      {hint && <div style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

function AccuracyChart({ detail }: { detail: ForecastAccuracyDetail }) {
  const data = detail.series.map((point) => ({
    ...point,
    band: point.lower !== null && point.upper !== null ? [point.lower, point.upper] : null,
  }));
  const names: Record<string, string> = {
    actual: "Real",
    predicted: "Previsto",
    band: "Intervalo 95%",
  };
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.border} vertical={false} />
        <XAxis
          dataKey="periodStart"
          tickFormatter={shortDate}
          tick={{ fontSize: 11, fill: theme.textSecondary, ...mono }}
          tickLine={false}
          axisLine={{ stroke: theme.border }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: theme.textSecondary, ...mono }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          labelFormatter={(label) => `Semana de ${shortDate(String(label))}`}
          formatter={(value, name) => [
            Array.isArray(value) ? `${value[0]} – ${value[1]}` : value,
            names[String(name)] ?? name,
          ]}
          contentStyle={{
            background: theme.bg,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Area
          dataKey="band"
          name="band"
          stroke="none"
          fill={theme.accent}
          fillOpacity={0.15}
          isAnimationActive={false}
        />
        <Line
          dataKey="actual"
          name="actual"
          stroke={theme.textPrimary}
          strokeWidth={2}
          dot={{ r: 2 }}
          isAnimationActive={false}
        />
        <Line
          dataKey="predicted"
          name="predicted"
          stroke={theme.accent}
          strokeWidth={2}
          strokeDasharray="6 4"
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function ForecastAccuracySection({
  accuracy,
  detail,
  search,
}: {
  accuracy: ForecastAccuracyResponse | null;
  detail: ForecastAccuracyDetail | null;
  search: string;
}) {
  if (!accuracy) {
    return (
      <section style={{ marginBottom: 32 }}>
        <div role="alert" style={{ ...card, borderColor: theme.warning, padding: 24 }}>
          <div style={{ fontWeight: 600, color: theme.textPrimary }}>
            Precisão da previsão indisponível
          </div>
          <div style={{ fontSize: 13, color: theme.textSecondary, marginTop: 6 }}>
            Inicie o serviço de analytics (<code>pnpm dev:analytics</code>) e confira se o pipeline
            da Olist foi executado.
          </div>
        </div>
      </section>
    );
  }

  const { summary, model } = accuracy;
  const term = search.trim().toLowerCase();
  const items = term
    ? accuracy.items.filter((item) =>
        `${item.product_id} ${item.category}`.toLowerCase().includes(term),
      )
    : accuracy.items;

  return (
    <section style={{ marginBottom: 32 }} aria-labelledby="forecast-accuracy-title">
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <h2
          id="forecast-accuracy-title"
          style={{ fontSize: 16, fontWeight: 600, color: theme.textPrimary }}
        >
          Precisão da previsão por produto
        </h2>
        <span style={{ fontSize: 12, color: theme.textSecondary }}>
          {model.name} · últimas {model.evaluation_weeks} semanas
          {summary.evaluated_until && ` até ${shortDate(summary.evaluated_until)}`}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Metric
          label="Acurácia geral"
          value={summary.accuracy === null ? "—" : percent.format(summary.accuracy)}
          hint="1 − WAPE, ponderada pelo volume"
        />
        <Metric
          label="Viés geral"
          value={biasText(summary.bias)}
          hint="para que lado o modelo erra"
        />
        <Metric
          label="Produtos avaliados"
          value={String(summary.products)}
          hint={`${summary.skipped_products} sem histórico suficiente`}
        />
        <Metric
          label="Baixa / Regular / Boa"
          value={`${summary.by_status.POOR} / ${summary.by_status.FAIR} / ${summary.by_status.GOOD}`}
          hint={`boa ≥ ${percent.format(model.thresholds.good)} · regular ≥ ${percent.format(model.thresholds.fair)}`}
        />
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)", gap: 24 }}
      >
        <div style={{ ...card, padding: 8, overflow: "auto", maxHeight: 520 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr
                style={{
                  color: theme.textSecondary,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  textAlign: "left",
                }}
              >
                <th style={{ padding: "10px 12px" }}>Produto</th>
                <th style={{ padding: "10px 12px" }}>Acurácia</th>
                <th style={{ padding: "10px 12px" }}>Viés</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const selected = item.product_id === detail?.product_id;
                return (
                  <tr
                    key={item.product_id}
                    style={{
                      background: selected ? theme.surfaceHover : "transparent",
                      borderTop: `1px solid ${theme.border}`,
                    }}
                  >
                    <td style={{ padding: "10px 12px" }}>
                      <Link
                        href={`?product=${item.product_id}`}
                        scroll={false}
                        aria-current={selected ? "true" : undefined}
                        style={{ color: theme.textPrimary, fontWeight: selected ? 600 : 500 }}
                      >
                        {productLabel(item)}
                      </Link>
                      <div style={{ fontSize: 11, color: theme.textSecondary }}>
                        {item.evaluated_units} un. no período
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", ...mono }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700 }}>
                          {item.accuracy === null ? "—" : percent.format(item.accuracy)}
                        </span>
                        <StatusPill status={item.status} />
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", color: theme.textSecondary }}>
                      {biasText(item.bias)}
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    style={{ padding: 24, textAlign: "center", color: theme.textSecondary }}
                  >
                    Nenhum produto corresponde à busca.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ ...card, padding: 24 }}>
          {detail ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: theme.textPrimary }}>
                    {productLabel(detail)}
                  </div>
                  <div style={{ ...mono, fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                    {detail.product_id}
                  </div>
                </div>
                <StatusPill status={detail.status} />
              </div>
              <AccuracyChart detail={detail} />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: 10,
                  marginTop: 16,
                }}
              >
                <Metric
                  label="Acurácia"
                  value={detail.accuracy === null ? "—" : percent.format(detail.accuracy)}
                />
                <Metric
                  label="Viés"
                  value={detail.bias === null ? "—" : signedPercent.format(detail.bias)}
                  hint={biasText(detail.bias)}
                />
                <Metric
                  label="Cobertura 95%"
                  value={
                    detail.interval_coverage === null
                      ? "—"
                      : percent.format(detail.interval_coverage)
                  }
                  hint="semanas dentro do intervalo"
                />
                <Metric
                  label={`Semana de ${shortDate(detail.next_period_start)}`}
                  value={`${detail.next_predicted.toLocaleString("pt-BR")} un.`}
                  hint="próxima previsão"
                />
              </div>
            </>
          ) : (
            <div style={{ color: theme.textSecondary, fontSize: 13 }}>
              Selecione um produto para ver previsto × real.
            </div>
          )}
        </div>
      </div>

      <p style={{ fontSize: 12, color: theme.textSecondary, marginTop: 12, lineHeight: 1.5 }}>
        {model.limitation}
      </p>
    </section>
  );
}
