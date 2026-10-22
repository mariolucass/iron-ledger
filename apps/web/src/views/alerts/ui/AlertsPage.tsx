"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { staggerContainer, staggerItem } from "@/shared/lib/animation";
import { PageHeader } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";
import { mockAlerts } from "../model/fixtures";
import { selectAlertsSummary, selectFilteredAlerts } from "../model/selectors";
import type { AlertTab, Severity, Source, SystemAlert } from "../model/types";
import { AlertCard } from "./components/AlertCard";
import { AlertsFilterBar } from "./components/AlertsFilterBar";
import { AlertsSummary } from "./components/AlertsSummary";

export function AlertsPage() {
  const [alerts, setAlerts] = useState<SystemAlert[]>(mockAlerts);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<Severity | "ALL">("ALL");
  const [source, setSource] = useState<Source | "ALL">("ALL");
  const [tab, setTab] = useState<AlertTab>("ALL");
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
      <div className="mx-auto w-full max-w-[1040px]">
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
