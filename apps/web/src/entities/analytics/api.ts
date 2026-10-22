import "server-only";

export type MetricUnit = "count" | "currency" | "ratio" | "hours" | "score";
export type Impact = "POSITIVE" | "NEGATIVE" | "NEUTRAL";

export interface MetricInfo {
  name: string;
  label: string;
  description: string;
  unit: MetricUnit;
  higher_is_better: boolean;
  what_to_check: string;
}

export interface AnalyticsCatalog {
  metrics: MetricInfo[];
  severities: Record<string, string>;
  classifications: Record<string, string>;
}

export interface MetricBreakdown {
  metric: string;
  label: string;
  total: number;
  positive: number;
  negative: number;
}

export interface AnalyticsSummary {
  observations: number;
  observedSellers: number;
  observationPeriod: { start: string | null; end: string | null };
  inflectionPoints: number;
  sellers: number;
  categories: number;
  firstDetection: string | null;
  lastDetection: string | null;
  bySeverity: Record<string, number>;
  byClassification: Record<string, number>;
  byImpact: Record<Impact, number>;
  byMetric: MetricBreakdown[];
  method: string;
  source: string;
}

export interface SeriesPoint {
  periodStart: string;
  value: number | null;
  orders: number;
  window: "baseline" | "current" | "after";
}

export interface InflectionPoint {
  id: string;
  detected_at: string;
  seller_id: string;
  product_category: string;
  metric: string;
  previous_value: number;
  current_value: number;
  absolute_change: number;
  change_percentage: number | null;
  robust_score: number;
  confidence: number;
  severity: string;
  classification: string | null;
  explanation: string;
  evidence: {
    method?: string;
    baselineWeeks?: number;
    currentWeeks?: number;
    baselineValues?: number[];
    currentValues?: number[];
    baselineOrders?: number;
    currentOrders?: number;
    confidenceMeaning?: string;
    limitation?: string;
  };
  source: string;
  metric_label: string;
  metric_description: string | null;
  unit: MetricUnit | null;
  higher_is_better: boolean | null;
  what_to_check: string | null;
  direction: "UP" | "DOWN" | "FLAT";
  impact: Impact;
  severity_label: string;
  classification_label: string | null;
  /** Apenas no detalhe. */
  seller_state?: string | null;
  /** Apenas no detalhe: série semanal em torno do ponto. */
  series?: SeriesPoint[];
}

export interface InflectionPointsResponse {
  items: InflectionPoint[];
  count: number;
  total: number;
  limit: number;
  offset: number;
}

export type AccuracyStatus = "GOOD" | "FAIR" | "POOR" | "UNKNOWN";

export interface ForecastAccuracyItem {
  product_id: string;
  category: string;
  units_total: number;
  evaluated_weeks: number;
  evaluated_units: number;
  /** 1 - WAPE, de 0 a 1. Nulo quando não houve venda na janela avaliada. */
  accuracy: number | null;
  wape: number | null;
  /** (previsto - real) / real: positivo superestima, negativo subestima. */
  bias: number | null;
  interval_coverage: number | null;
  status: AccuracyStatus;
  next_period_start: string;
  next_predicted: number;
}

export interface ForecastAccuracyResponse {
  items: ForecastAccuracyItem[];
  summary: {
    products: number;
    skipped_products: number;
    accuracy: number | null;
    wape: number | null;
    bias: number | null;
    evaluated_units: number;
    evaluated_until: string | null;
    by_status: Record<"GOOD" | "FAIR" | "POOR", number>;
  };
  model: {
    name: string;
    description: string;
    granularity: string;
    window_weeks: number;
    evaluation_weeks: number;
    interval_confidence: number;
    thresholds: { good: number; fair: number };
    source: string;
    limitation: string;
  };
}

export interface ForecastAccuracyPoint {
  periodStart: string;
  actual: number;
  predicted: number;
  lower: number | null;
  upper: number | null;
  error: number;
}

export interface ForecastAccuracyDetail extends ForecastAccuracyItem {
  series: ForecastAccuracyPoint[];
}

export class AnalyticsError extends Error {
  constructor(public readonly status: number) {
    super(
      status === 404
        ? "Ponto de inflexão não encontrado."
        : "Não foi possível consultar o serviço de analytics.",
    );
  }
}

async function analyticsGet<T>(path: string): Promise<T> {
  const base =
    process.env.ANALYTICS_URL ?? `http://localhost:${process.env.ANALYTICS_PORT ?? "8000"}`;
  try {
    const response = await fetch(new URL(path, base), {
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new AnalyticsError(response.status);
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof AnalyticsError) throw error;
    throw new AnalyticsError(503);
  }
}

export const getAnalyticsSummary = () => analyticsGet<AnalyticsSummary>("/analytics/summary");

export const getAnalyticsCatalog = () => analyticsGet<AnalyticsCatalog>("/analytics/metrics");

export function getInflectionPoints(
  query: {
    seller_id?: string;
    metric?: string;
    severity?: string;
    classification?: string;
    impact?: string;
    offset?: number;
    limit?: number;
  } = {},
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return analyticsGet<InflectionPointsResponse>(`/analytics/inflection-points?${params}`);
}

export const getInflectionPoint = (slug: string) =>
  analyticsGet<InflectionPoint>(`/analytics/inflection-points/${encodeURIComponent(slug)}`);

export function getForecastAccuracy(query: { category?: string; search?: string; limit?: number } = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return analyticsGet<ForecastAccuracyResponse>(`/analytics/forecast-accuracy?${params}`);
}

export const getForecastAccuracyDetail = (productId: string) =>
  analyticsGet<ForecastAccuracyDetail>(
    `/analytics/forecast-accuracy/${encodeURIComponent(productId)}`,
  );
