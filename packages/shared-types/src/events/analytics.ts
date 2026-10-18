export type AnalyticsSource = "OLIST" | "COMPANY";

export type AnalyticsEntityType =
  | "COMPANY"
  | "LOCATION"
  | "SELLER"
  | "PRODUCT"
  | "CATEGORY"
  | "SELLER_CATEGORY";

export type InflectionSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AnalyticsObservationCreated {
  eventId: string;
  eventName: "Analytics.ObservationCreated";
  occurredAt: string;
  source: AnalyticsSource;
  payload: {
    observationId: string;
    companyId?: string;
    entityType: AnalyticsEntityType;
    entityId: string;
    periodStart: string;
    periodEnd: string;
    metrics: Record<string, number | null>;
    dataQuality: number;
  };
}

export interface InflectionPointDetected {
  eventId: string;
  eventName: "Analytics.InflectionPointDetected";
  occurredAt: string;
  source: AnalyticsSource;
  payload: {
    sourceObservationIds: string[];
    entityType: AnalyticsEntityType;
    entityId: string;
    metric: string;
    previousValue: number;
    currentValue: number;
    absoluteChange: number;
    changePercentage: number | null;
    robustScore: number;
    confidence: number;
    severity: InflectionSeverity;
    explanation: string;
    method: "median_mad_persistent_window";
    limitations: string[];
  };
}
