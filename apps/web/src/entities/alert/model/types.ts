export type AlertType =
  | "LOW_STOCK"
  | "STOCKOUT"
  | "OVERSTOCK"
  | "LOT_EXPIRING"
  | "STALE_RESERVATION"
  | "DEMAND_ANOMALY"
  | "SAGA_FAILURE"
  | "COUNT_VARIANCE";

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";
export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "SUPPRESSED";
export type AlertStatusUpdate = "ACKNOWLEDGED" | "RESOLVED";

export interface AlertItem {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  payload: unknown;
  occurrences: number;
  triggeredAt: string;
  lastSeenAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
}

export interface AlertListResponse {
  items: AlertItem[];
  total: number;
  counts: { open: number; acknowledged: number; resolved: number; critical: number };
}
