import type { AlertFilters, AlertsSummaryData, SystemAlert } from "./types";

export function selectFilteredAlerts(alerts: SystemAlert[], filters: AlertFilters) {
  const term = filters.search.trim().toLocaleLowerCase("pt-BR");
  return alerts.filter(
    (alert) =>
      (filters.tab === "ALL" || alert.status === filters.tab) &&
      (filters.severity === "ALL" || alert.severity === filters.severity) &&
      (filters.source === "ALL" || alert.source === filters.source) &&
      (!term ||
        [alert.title, alert.description, alert.id].some((value) =>
          value.toLocaleLowerCase("pt-BR").includes(term),
        )),
  );
}

export function selectAlertsSummary(alerts: SystemAlert[]): AlertsSummaryData {
  const activeCount = alerts.filter(({ status }) => status === "ACTIVE").length;
  const acknowledgedCount = alerts.filter(({ status }) => status === "ACKNOWLEDGED").length;
  const resolvedCount = alerts.filter(({ status }) => status === "RESOLVED").length;
  const unresolved = alerts.filter(({ status }) => status !== "RESOLVED");
  const percentage = (severity: "CRITICAL" | "WARNING" | "INFO") =>
    unresolved.length
      ? Math.round(
          (unresolved.filter((alert) => alert.severity === severity).length / unresolved.length) *
            100,
        )
      : 0;

  return {
    activeCount,
    acknowledgedCount,
    resolvedCount,
    criticalCount: alerts.filter(
      (alert) => alert.status === "ACTIVE" && alert.severity === "CRITICAL",
    ).length,
    healthPct: alerts.length ? Math.round((resolvedCount / alerts.length) * 100) : 100,
    severityPercentages: {
      CRITICAL: percentage("CRITICAL"),
      WARNING: percentage("WARNING"),
      INFO: percentage("INFO"),
    },
  };
}
