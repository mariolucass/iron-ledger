"use client";

import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftRight, ChevronRight, Plus } from "lucide-react";
import { Layout } from "@/widgets/layout";
import { PageHeader, primaryActionClass, secondaryActionClass } from "@/shared/ui/data-list";
import { statusColors } from "@/shared/config/tokens";
import { cn } from "@/shared/ui/kit/utils";
import {
  type DashboardStockAlert,
  type DashboardTransaction,
  type KPI,
  dashboardRecentTransactions as recentTransactions,
  dashboardStockAlerts as stockAlerts,
  kpis,
} from "../model/dashboardData";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const typeLabel: Record<DashboardTransaction["type"], string> = {
  ENTRADA: "Entrada",
  SAÍDA: "Saída",
  AJUSTE: "Ajuste",
};

const severity: Record<DashboardStockAlert["severity"], { label: string; text: string; dot: string; rank: number }> = {
  CRITICAL: { label: "Crítico", text: "text-destructive", dot: "bg-destructive", rank: 0 },
  HIGH: { label: "Alto", text: "text-destructive", dot: "bg-destructive/60", rank: 1 },
  MEDIUM: { label: "Médio", text: "text-warning", dot: "bg-warning", rank: 2 },
  LOW: { label: "Baixo", text: "text-muted-foreground", dot: "bg-ink/30", rank: 3 },
};

const toneClass: Record<KPI["tone"], string> = {
  neutral: "text-muted-foreground",
  positive: "text-primary",
  negative: "text-destructive",
};

function formatToday(): string {
  const label = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// ─── Attention items ─────────────────────────────────────────────────────────

interface AttentionItem {
  key: string;
  title: string;
  detail: string;
  href: Route;
  dot: string;
}

/** Só o que exige decisão do operador: falhas, compensações e ruptura iminente. */
function buildAttentionItems(): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const tx of recentTransactions) {
    if (tx.status !== "FAILED" && tx.status !== "COMPENSATING") continue;
    items.push({
      key: tx.id,
      title: tx.status === "FAILED" ? `Transação ${tx.id} falhou` : `Transação ${tx.id} em compensação`,
      detail: `${typeLabel[tx.type]} · ${tx.initiatedBy} · ${tx.relativeTime}`,
      href: `/transactions/${tx.id}` as Route,
      dot: tx.status === "FAILED" ? "bg-destructive" : "bg-warning",
    });
  }

  const critical = stockAlerts.filter((a) => a.severity === "CRITICAL");
  if (critical.length > 0) {
    items.push({
      key: "critical-stock",
      title:
        critical.length === 1
          ? `${critical[0].product} abaixo do mínimo`
          : `${critical.length} produtos em nível crítico`,
      detail: [...new Set(critical.map((a) => a.warehouse))].join(", "),
      href: "/alerts",
      dot: "bg-destructive",
    });
  }

  return items;
}

function AttentionList({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="attention-heading" className="mb-8">
      <h2 id="attention-heading" className="mb-3 text-[13px] font-medium tracking-[-0.005em] text-muted-foreground">
        Requer atenção <span className="text-subtle-foreground tabular-nums">· {items.length}</span>
      </h2>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className={cn(
                "group flex items-center gap-3.5 px-4 py-3 transition-colors duration-150 hover:bg-card-hover motion-reduce:transition-none sm:px-5",
                focusRing,
              )}
            >
              <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", item.dot)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium tracking-[-0.01em] text-foreground">
                  {item.title}
                </span>
                <span className="block truncate text-[12.5px] text-muted-foreground">{item.detail}</span>
              </span>
              <ChevronRight
                aria-hidden
                size={16}
                className="shrink-0 text-subtle-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-muted-foreground motion-reduce:transition-none"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

function Sparkline({ values }: { values: number[] }) {
  const width = 72;
  const height = 24;
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const points = values.map((v, i) => [
    (i / (values.length - 1)) * width,
    height - 2 - ((v - min) / range) * (height - 4),
  ]);
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg aria-hidden viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="overflow-visible">
      <polyline
        points={points.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="none"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="stroke-ink/25"
      />
      <circle cx={lastX} cy={lastY} r={2} className="fill-foreground" />
    </svg>
  );
}

function MetricCard({ kpi }: { kpi: KPI }) {
  return (
    <Link
      href={kpi.href}
      className={cn(
        "group flex flex-col justify-between gap-5 rounded-xl border border-border bg-card p-5 transition-colors duration-150 hover:border-border-strong hover:bg-card-hover motion-reduce:transition-none",
        focusRing,
      )}
    >
      <span className="flex items-center justify-between text-[13px] font-medium tracking-[-0.005em] text-muted-foreground">
        {kpi.label}
        <ChevronRight
          aria-hidden
          size={14}
          className="text-subtle-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
        />
      </span>
      <span className="flex items-end justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-[30px] leading-none font-semibold tracking-[-0.035em] text-foreground tabular-nums">
            {kpi.value}
          </span>
          <span className={cn("mt-2 block truncate text-[12.5px]", toneClass[kpi.tone])}>{kpi.detail}</span>
        </span>
        <Sparkline values={kpi.sparkline} />
      </span>
    </Link>
  );
}

// ─── Panels ──────────────────────────────────────────────────────────────────

function Panel({
  id,
  title,
  count,
  link,
  children,
}: {
  id: string;
  title: string;
  count?: number;
  link: { href: Route; label: string };
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 id={id} className="m-0 text-[15px] font-semibold tracking-[-0.015em] text-foreground">
          {title}
          {count !== undefined && <span className="ml-1.5 font-normal text-subtle-foreground tabular-nums">{count}</span>}
        </h2>
        <Link
          href={link.href}
          className={cn("rounded text-[13px] font-medium text-primary transition-opacity hover:opacity-80", focusRing)}
        >
          {link.label}
        </Link>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">{children}</ul>
    </section>
  );
}

const rowClass = cn(
  "flex items-center justify-between gap-4 px-4 py-3.5 transition-colors duration-150 hover:bg-card-hover motion-reduce:transition-none sm:px-5",
  focusRing,
);

function TransactionRow({ tx }: { tx: DashboardTransaction }) {
  const status = statusColors[tx.status];

  return (
    <li>
      <Link href={`/transactions/${tx.id}` as Route} className={rowClass}>
        <span className="min-w-0">
          <span className="block font-mono text-[13px] font-medium tracking-[-0.01em] text-foreground">{tx.id}</span>
          <span className="mt-0.5 block truncate text-[12.5px] text-muted-foreground">
            {typeLabel[tx.type]} · {tx.initiatedBy}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="flex items-center justify-end gap-1.5 text-[12.5px] font-medium" style={{ color: status?.text }}>
            <span aria-hidden className="size-1.5 rounded-full" style={{ background: status?.text }} />
            {status?.label ?? tx.status}
          </span>
          <time dateTime={tx.timestamp.replace(" ", "T")} className="mt-0.5 block text-[12px] text-subtle-foreground tabular-nums">
            {tx.relativeTime}
          </time>
        </span>
      </Link>
    </li>
  );
}

function StockRow({ alert }: { alert: DashboardStockAlert }) {
  const level = severity[alert.severity];
  const fill = Math.min(alert.current / alert.min, 1) * 100;

  return (
    <li>
      <Link href="/alerts" className={rowClass}>
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-medium tracking-[-0.01em] text-foreground">
            {alert.product}
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] text-muted-foreground">
            {alert.warehouse} · {alert.category}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="text-[12.5px] tabular-nums">
            <span className={cn("font-semibold", level.text)}>{alert.current}</span>
            <span className="text-subtle-foreground"> / {alert.min} un.</span>
          </span>
          <span
            role="meter"
            aria-label={`Nível ${level.label.toLowerCase()}`}
            aria-valuemin={0}
            aria-valuemax={alert.min}
            aria-valuenow={alert.current}
            className="block h-[3px] w-14 overflow-hidden rounded-full bg-ink/[0.08]"
          >
            <span className={cn("block h-full rounded-full", level.dot)} style={{ width: `${fill}%` }} />
          </span>
        </span>
      </Link>
    </li>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const attention = buildAttentionItems();
  const sortedAlerts = [...stockAlerts].sort(
    (a, b) => severity[a.severity].rank - severity[b.severity].rank || a.current / a.min - b.current / b.min,
  );

  return (
    <Layout title="Dashboard">
      <PageHeader
        title="Visão geral"
        meta={<span suppressHydrationWarning>{formatToday()}</span>}
        actions={
          <>
            <Link href={"/inventory/movements/new" as Route} className={secondaryActionClass}>
              <ArrowLeftRight size={16} aria-hidden />
              Registrar movimentação
            </Link>
            <Link href={"/transactions/new" as Route} className={primaryActionClass}>
              <Plus size={16} aria-hidden />
              Nova transação
            </Link>
          </>
        }
      />

      <AttentionList items={attention} />

      <section aria-label="Indicadores" className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <MetricCard key={kpi.label} kpi={kpi} />
        ))}
      </section>

      <div className="grid grid-cols-1 gap-x-6 gap-y-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel id="recent-transactions" title="Transações recentes" link={{ href: "/transactions", label: "Ver todas" }}>
          {recentTransactions.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </Panel>

        <Panel
          id="low-stock"
          title="Abaixo do mínimo"
          count={sortedAlerts.length}
          link={{ href: "/alerts", label: "Ver alertas" }}
        >
          {sortedAlerts.map((alert) => (
            <StockRow key={`${alert.product}-${alert.warehouse}`} alert={alert} />
          ))}
        </Panel>
      </div>
    </Layout>
  );
}
