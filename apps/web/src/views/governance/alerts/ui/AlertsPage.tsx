"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { alertApi, type AlertItem, type AlertStatusUpdate, type AlertType } from "@/entities/alert";
import { withSession } from "@/shared/auth/with-session";
import { staggerContainer, staggerItem } from "@/shared/lib/animation";
import { ListError, PageHeader } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";
import { selectAlertsSummary, selectFilteredAlerts } from "../model/selectors";
import type { AlertTab, Source, SystemAlert } from "../model/types";
import { AlertCard } from "./components/AlertCard";
import { AlertsFilterBar } from "./components/AlertsFilterBar";
import { AlertsSummary } from "./components/AlertsSummary";

const relativeTime = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
const inventoryAlertTypes: AlertType[] = [
  "LOW_STOCK",
  "STOCKOUT",
  "OVERSTOCK",
  "LOT_EXPIRING",
  "STALE_RESERVATION",
  "COUNT_VARIANCE",
];

function formatRelativeTime(value: string): string {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1_000);
  if (!Number.isFinite(seconds)) return new Date(value).toLocaleString("pt-BR");
  if (Math.abs(seconds) < 60) return relativeTime.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return relativeTime.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relativeTime.format(hours, "hour");
  return relativeTime.format(Math.round(hours / 24), "day");
}

function payloadRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function toSystemAlert(item: AlertItem): SystemAlert {
  const payload = payloadRecord(item.payload);
  const failureReason = typeof payload.failureReason === "string" ? payload.failureReason : item.message;
  const failureCode = typeof payload.failureCode === "string" ? payload.failureCode : null;
  const transactionCode = typeof payload.transactionCode === "string" ? payload.transactionCode : null;
  const source: Source = item.type === "SAGA_FAILURE"
    ? "TRANSACTIONS"
    : item.type === "DEMAND_ANOMALY"
      ? "FORECASTING"
      : inventoryAlertTypes.includes(item.type)
        ? "INVENTORY"
        : "SYSTEM";

  return {
    id: item.id,
    title: item.title,
    description: item.message,
    detail: failureCode ? `${failureReason}\nCódigo: ${failureCode}` : failureReason,
    severity: item.severity,
    source,
    timestamp: formatRelativeTime(item.lastSeenAt),
    ts_iso: item.triggeredAt,
    status: item.status === "OPEN" ? "ACTIVE" : item.status === "ACKNOWLEDGED" ? "ACKNOWLEDGED" : "RESOLVED",
    affectedEntity: transactionCode ?? item.entityId ?? undefined,
  };
}

export function AlertsPage() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<SystemAlert["severity"] | "ALL">("ALL");
  const [source, setSource] = useState<Source | "ALL">("ALL");
  const [tab, setTab] = useState<AlertTab>("ALL");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [resolvingAll, setResolvingAll] = useState(false);

  const loadAlerts = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const result = await withSession(alertApi.list());
      setAlerts(result.items.map(toSystemAlert));
      setLoadError(null);
      setLastSync(new Date());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Não foi possível carregar os alertas.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts(true);
    const interval = window.setInterval(() => void loadAlerts(), 15_000);
    return () => window.clearInterval(interval);
  }, [loadAlerts]);

  const summary = useMemo(() => selectAlertsSummary(alerts), [alerts]);
  const filtered = useMemo(
    () => selectFilteredAlerts(alerts, { search, severity, source, tab }),
    [alerts, search, severity, source, tab],
  );
  const updateStatus = (id: string, status: SystemAlert["status"]) =>
    setAlerts((current) =>
      current.map((alert) => (alert.id === id ? { ...alert, status } : alert)),
    );
  const counts: Record<AlertTab, number> = {
    ALL: alerts.length,
    ACTIVE: summary.activeCount,
    ACKNOWLEDGED: summary.acknowledgedCount,
    RESOLVED: summary.resolvedCount,
  };

  return (
    <Layout title="Centro de Alertas">
      <div className="w-full">
        <PageHeader
          eyebrow="Monitoramento em tempo real"
          title="Centro de alertas"
          description="Anomalias e eventos críticos do sistema, por severidade e origem."
          actions={
            <span className="font-mono text-[12.5px] text-ink/50">
              Última sincronização · 13:58:42 UTC
            </span>
          }
        />
        <AlertsSummary {...summary} total={alerts.length} />
        <AlertsFilterBar
          activeTab={tab}
          counts={counts}
          search={search}
          severity={severity}
          source={source}
          canResolveAll={summary.activeCount + summary.acknowledgedCount > 0}
          onTabChange={setTab}
          onSearchChange={setSearch}
          onSeverityChange={setSeverity}
          onSourceChange={setSource}
          onResolveAll={() =>
            setAlerts((current) => current.map((alert) => ({ ...alert, status: "RESOLVED" })))
          }
        />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filtered.length ? (
              filtered.map((alert) => (
                <motion.div key={alert.id} variants={staggerItem} layout exit={{ opacity: 0 }}>
                  <AlertCard
                    alert={alert}
                    onAcknowledge={(id) => updateStatus(id, "ACKNOWLEDGED")}
                    onResolve={(id) => updateStatus(id, "RESOLVED")}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                key="empty"
                variants={staggerItem}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-dashed border-border bg-card px-8 py-16 text-center"
              >
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <CheckCircle size={26} />
                </div>
                <h2 className="mb-1.5 text-base font-bold tracking-[-0.02em]">
                  Nenhum alerta encontrado
                </h2>
                <p className="text-[13.5px] text-muted-foreground">
                  {search
                    ? "Tente ajustar os termos de pesquisa ou filtros."
                    : "Tudo parece estar a funcionar normalmente."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        {filtered.length > 0 && (
          <footer className="mt-6 flex justify-center font-mono text-xs text-subtle-foreground">
            {filtered.length} alerta{filtered.length !== 1 ? "s" : ""} · última atualização:
            2026-06-09 13:58 UTC
          </footer>
        )}
      </div>
    </Layout>
  );
}
