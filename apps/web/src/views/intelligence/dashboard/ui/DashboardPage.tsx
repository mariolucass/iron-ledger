"use client";

import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, ChevronRight, Plus } from "lucide-react";
import { alertApi, type AlertItem } from "@/entities/alert";
import { inventoryApi, type InventoryItem, type InventoryStatus } from "@/entities/inventory";
import {
  isTerminalStatus,
  TransactionStatusBadge,
  transactionApi,
  type TransactionSummary,
} from "@/entities/transaction";
import { Layout } from "@/widgets/layout";
import { PageHeader, primaryActionClass, secondaryActionClass } from "@/shared/ui/data-list";
import { cn } from "@/shared/ui/kit/utils";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const REFRESH_MS = 15_000;

const typeLabel: Record<string, string> = {
  SALE: "Saída",
  PURCHASE_RECEIPT: "Entrada",
  RETURN: "Devolução",
  ADJUSTMENT: "Ajuste",
  TRANSFER: "Transferência",
};

const stockLevel: Record<InventoryStatus, { label: string; text: string; dot: string; rank: number }> = {
  CRITICAL: { label: "Crítico", text: "text-destructive", dot: "bg-destructive", rank: 0 },
  LOW: { label: "Baixo", text: "text-warning", dot: "bg-warning", rank: 1 },
  OK: { label: "Normal", text: "text-muted-foreground", dot: "bg-ink/30", rank: 2 },
};

interface KPI {
  label: string;
  value: string;
  /** Contexto curto abaixo do valor. */
  detail: string;
  /** `negative` só quando o número pede ação. */
  tone: "neutral" | "positive" | "negative";
  href: Route;
}

const toneClass: Record<KPI["tone"], string> = {
  neutral: "text-muted-foreground",
  positive: "text-primary",
  negative: "text-destructive",
};

function formatToday(): string {
  const label = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function relativeTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  return `há ${Math.floor(hours / 24)} d`;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// ─── Data ────────────────────────────────────────────────────────────────────

function useDashboardData() {
  const inventory = useQuery({
    queryKey: ["dashboard", "inventory"],
    queryFn: () => inventoryApi.list({ pageSize: 100 }),
    refetchInterval: REFRESH_MS,
  });
  const transactions = useQuery({
    queryKey: ["dashboard", "transactions"],
    queryFn: () => transactionApi.list({ pageSize: 50 }),
    refetchInterval: REFRESH_MS,
  });
  const alerts = useQuery({
    queryKey: ["dashboard", "alerts"],
    queryFn: () => alertApi.list(),
    refetchInterval: REFRESH_MS,
  });
  return { inventory, transactions, alerts };
}

// ─── Attention items ─────────────────────────────────────────────────────────

interface AttentionItem {
  key: string;
  title: string;
  detail: string;
  href: Route;
  dot: string;
}

/** Só o que exige decisão do operador: alertas abertos, sagas em andamento/compensação e ruptura iminente. */
function buildAttentionItems(alerts: AlertItem[], transactions: TransactionSummary[], stock: InventoryItem[]): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const alert of alerts.filter((a) => a.status === "OPEN").slice(0, 3)) {
    items.push({
      key: `alert-${alert.id}`,
      title: alert.title,
      detail: `${alert.message} · ${relativeTime(alert.triggeredAt)}`,
      href: "/alerts",
      dot: alert.severity === "CRITICAL" ? "bg-destructive" : "bg-warning",
    });
  }

  for (const tx of transactions.filter((t) => !isTerminalStatus(t.status)).slice(0, 3)) {
    items.push({
      key: `tx-${tx.id}`,
      title: `Transação ${tx.code} ${tx.status === "COMPENSATING" ? "em compensação" : "em andamento"}`,
      detail: `${typeLabel[tx.type] ?? tx.type} · ${plural(tx.totalQuantity, "unidade", "unidades")} · ${relativeTime(tx.createdAt)}`,
      href: `/transactions/${tx.id}` as Route,
      dot: tx.status === "COMPENSATING" ? "bg-warning" : "bg-info",
    });
  }

  const critical = stock.filter((s) => s.status === "CRITICAL");
  if (critical.length > 0) {
    items.push({
      key: "critical-stock",
      title:
        critical.length === 1
          ? `${critical[0].productName} abaixo do mínimo`
          : `${critical.length} produtos em nível crítico`,
      detail: [...new Set(critical.map((s) => s.warehouseName))].join(", "),
      href: "/inventory",
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
      <span className="min-w-0">
        <span className="block text-[30px] leading-none font-semibold tracking-[-0.035em] text-foreground tabular-nums">
          {kpi.value}
        </span>
        <span className={cn("mt-2 block truncate text-[12.5px]", toneClass[kpi.tone])}>{kpi.detail}</span>
      </span>
    </Link>
  );
}

function MetricSkeleton() {
  return (
    <div className="flex h-[132px] animate-pulse flex-col justify-between rounded-xl border border-border bg-card p-5 motion-reduce:animate-none">
      <span className="h-3 w-28 rounded bg-ink/10" />
      <span className="h-8 w-20 rounded bg-ink/10" />
    </div>
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

function PanelMessage({ children }: { children: ReactNode }) {
  return <li className="px-5 py-8 text-center text-[13.5px] text-muted-foreground">{children}</li>;
}

function RowSkeleton() {
  return (
    <li className="flex animate-pulse items-center justify-between gap-4 px-5 py-4 motion-reduce:animate-none">
      <span className="space-y-2">
        <span className="block h-3 w-36 rounded bg-ink/10" />
        <span className="block h-2.5 w-24 rounded bg-ink/10" />
      </span>
      <span className="h-3 w-16 rounded bg-ink/10" />
    </li>
  );
}

function TransactionRow({ tx }: { tx: TransactionSummary }) {
  return (
    <li>
      <Link href={`/transactions/${tx.id}` as Route} className={rowClass}>
        <span className="min-w-0">
          <span className="block font-mono text-[13px] font-medium tracking-[-0.01em] text-foreground">{tx.code}</span>
          <span className="mt-0.5 block truncate text-[12.5px] text-muted-foreground">
            {typeLabel[tx.type] ?? tx.type} · {plural(tx.totalQuantity, "unidade", "unidades")}
            {tx.externalRef ? ` · ${tx.externalRef}` : ""}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <TransactionStatusBadge status={tx.status} />
          <time dateTime={tx.createdAt} className="mt-1 block text-[12px] text-subtle-foreground tabular-nums">
            {relativeTime(tx.createdAt)}
          </time>
        </span>
      </Link>
    </li>
  );
}

function StockRow({ item }: { item: InventoryItem }) {
  const level = stockLevel[item.status];
  const fill = item.minStock > 0 ? Math.min(item.available / item.minStock, 1) * 100 : 100;

  return (
    <li>
      <Link href="/inventory" className={rowClass}>
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-medium tracking-[-0.01em] text-foreground">
            {item.productName}
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] text-muted-foreground">
            {item.warehouseName} · {item.sku}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="text-[12.5px] tabular-nums">
            <span className={cn("font-semibold", level.text)}>{item.available}</span>
            <span className="text-subtle-foreground">
              {" "}
              / {item.minStock} {item.unit}
            </span>
          </span>
          <span
            role="meter"
            aria-label={`Nível ${level.label.toLowerCase()}`}
            aria-valuemin={0}
            aria-valuemax={item.minStock}
            aria-valuenow={item.available}
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
  const { inventory, transactions, alerts } = useDashboardData();

  const stock = inventory.data?.items ?? [];
  const recent = transactions.data?.items ?? [];
  const alertItems = alerts.data?.items ?? [];

  const belowMin = stock
    .filter((s) => s.status !== "OK")
    .sort((a, b) => stockLevel[a.status].rank - stockLevel[b.status].rank || a.available / (a.minStock || 1) - b.available / (b.minStock || 1));
  const active = recent.filter((t) => !isTerminalStatus(t.status));
  const failed = recent.filter((t) => t.status === "FAILED").length;
  const openAlerts = alertItems.filter((a) => a.status === "OPEN");
  const open = openAlerts.length;
  const critical = openAlerts.filter((a) => a.severity === "CRITICAL").length;
  const warehouses = new Set(stock.map((s) => s.warehouseId)).size;
  const products = new Set(stock.map((s) => s.productId)).size;

  const kpis: KPI[] = [
    {
      label: "Saldos em estoque",
      value: String(inventory.data?.total ?? stock.length),
      detail: `${plural(products, "produto", "produtos")} · ${plural(warehouses, "armazém", "armazéns")}`,
      tone: "neutral",
      href: "/inventory",
    },
    {
      label: "Transações em andamento",
      value: String(active.length),
      detail: `${plural(transactions.data?.total ?? recent.length, "transação", "transações")} no total · ${plural(failed, "falha", "falhas")}`,
      tone: active.length > 0 ? "positive" : "neutral",
      href: "/transactions",
    },
    {
      label: "Alertas abertos",
      value: String(open),
      detail: critical > 0 ? `${critical} crítico${critical === 1 ? "" : "s"}` : "Nenhum crítico",
      tone: critical > 0 ? "negative" : "neutral",
      href: "/alerts",
    },
    {
      label: "Abaixo do mínimo",
      value: String(belowMin.length),
      detail: belowMin.length > 0 ? `${belowMin.filter((s) => s.status === "CRITICAL").length} em nível crítico` : "Estoque saudável",
      tone: belowMin.length > 0 ? "negative" : "positive",
      href: "/inventory",
    },
  ];

  const attention = buildAttentionItems(alertItems, recent, stock);
  const kpiLoading = inventory.isPending || transactions.isPending || alerts.isPending;
  const loadError = [inventory, transactions, alerts].find((q) => q.error)?.error;

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

      {loadError && (
        <p role="alert" className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13.5px] text-destructive">
          Não foi possível carregar parte dos dados ({loadError instanceof Error ? loadError.message : "erro desconhecido"}). Tentando novamente
          automaticamente.
        </p>
      )}

      <AttentionList items={attention} />

      <section aria-label="Indicadores" className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-4 2xl:gap-6">
        {kpiLoading
          ? Array.from({ length: 4 }, (_, i) => <MetricSkeleton key={i} />)
          : kpis.map((kpi) => <MetricCard key={kpi.label} kpi={kpi} />)}
      </section>

      <div className="grid grid-cols-1 gap-x-6 gap-y-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] 2xl:gap-x-8">
        <Panel id="recent-transactions" title="Transações recentes" link={{ href: "/transactions", label: "Ver todas" }}>
          {transactions.isPending ? (
            Array.from({ length: 4 }, (_, i) => <RowSkeleton key={i} />)
          ) : recent.length === 0 ? (
            <PanelMessage>Nenhuma transação ainda. Inicie a primeira em “Nova transação”.</PanelMessage>
          ) : (
            recent.slice(0, 6).map((tx) => <TransactionRow key={tx.id} tx={tx} />)
          )}
        </Panel>

        <Panel
          id="low-stock"
          title="Abaixo do mínimo"
          count={inventory.isPending ? undefined : belowMin.length}
          link={{ href: "/inventory", label: "Ver estoque" }}
        >
          {inventory.isPending ? (
            Array.from({ length: 3 }, (_, i) => <RowSkeleton key={i} />)
          ) : belowMin.length === 0 ? (
            <PanelMessage>Todos os saldos estão acima do mínimo.</PanelMessage>
          ) : (
            belowMin.slice(0, 6).map((item) => <StockRow key={item.stockLevelId} item={item} />)
          )}
        </Panel>
      </div>
    </Layout>
  );
}
