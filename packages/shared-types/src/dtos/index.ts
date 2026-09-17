import type {
  AnalyticsEntityType,
  AnalyticsSource,
  InflectionSeverity,
} from "../events";

export interface InflectionPointDto {
  id: string;
  detectedAt: string;
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
  source: AnalyticsSource;
  evidence: {
    method: string;
    baselineWeeks: number;
    currentWeeks: number;
    baselineValues: number[];
    currentValues: number[];
    baselineOrders: number;
    currentOrders: number;
    confidenceMeaning: string;
    limitation: string;
  };
}

export interface InflectionPointListDto {
  items: InflectionPointDto[];
  count: number;
  limit: number;
  offset: number;
}
