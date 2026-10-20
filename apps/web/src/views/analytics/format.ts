import type { Impact, MetricUnit } from "@/entities/analytics/api";

const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percent = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

export const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(value);

/** Formata o valor de uma métrica na unidade dela (R$, %, horas, nota). */
export function formatMetric(value: number | null | undefined, unit: MetricUnit | null) {
  if (value === null || value === undefined) return "—";
  switch (unit) {
    case "currency":
      return currency.format(value);
    case "ratio":
      return percent.format(value);
    case "hours":
      return value >= 48 ? `${decimal.format(value / 24)} dias` : `${decimal.format(value)} h`;
    case "score":
      return `${decimal.format(value)} / 5`;
    default:
      return decimal.format(value);
  }
}

/** Variação absoluta com sinal; taxas viram pontos percentuais. */
export function formatChange(value: number, unit: MetricUnit | null) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const magnitude = Math.abs(value);
  if (unit === "ratio") return `${sign}${decimal.format(magnitude * 100)} p.p.`;
  return `${sign}${formatMetric(magnitude, unit)}`;
}

export function formatDate(value: string | null, style: "medium" | "long" = "medium") {
  return value
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: style, timeZone: "UTC" }).format(
        new Date(value),
      )
    : "—";
}

export const impactLabel: Record<Impact, string> = {
  POSITIVE: "Melhorou",
  NEGATIVE: "Piorou",
  NEUTRAL: "Neutro",
};
