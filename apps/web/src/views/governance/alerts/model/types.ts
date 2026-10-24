import type { AlertSeverity } from "@/entities/alert";

export type Severity = AlertSeverity;
export type Source = "FORECASTING" | "TRANSACTIONS" | "INVENTORY" | "SECURITY" | "SYSTEM";
export type Status = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
export type AlertTab = Status | "ALL";

export interface SystemAlert {
  id: string;
  title: string;
  description: string;
  detail: string;
  severity: Severity;
  source: Source;
  timestamp: string;
  ts_iso: string;
  status: Status;
  affectedEntity?: string;
}

export interface AlertFilters {
  search: string;
  severity: Severity | "ALL";
  source: Source | "ALL";
  tab: AlertTab;
}

export interface AlertsSummaryData {
  activeCount: number;
  acknowledgedCount: number;
  criticalCount: number;
  healthPct: number;
  resolvedCount: number;
  severityPercentages: Record<"CRITICAL" | "WARNING" | "INFO", number>;
}
