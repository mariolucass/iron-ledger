import "server-only";

export interface AnalyticsSummary {
  observations: number;
  inflectionPoints: number;
  sellers: number;
  categories: number;
  firstDetection: string | null;
  lastDetection: string | null;
  bySeverity: Record<string, number>;
  method: string;
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
}

export interface InflectionPointsResponse {
  items: InflectionPoint[];
  count: number;
  limit: number;
  offset: number;
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

export function getInflectionPoints(
  query: {
    seller_id?: string;
    metric?: string;
    severity?: string;
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
