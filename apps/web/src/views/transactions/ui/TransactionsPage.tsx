"use client";

import { ArrowLeftRight, Plus, RefreshCw } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  isTerminalStatus,
  TransactionStatusBadge,
  transactionStatusLabel,
  type TransactionStatus,
  type TransactionSummary,
} from "@/entities/transaction";
import { StartTransactionDialog, type TransactionStockOption } from "@/features/start-transaction";
import { usePolling } from "@/shared/lib/use-polling";
import { useRemoteList } from "@/shared/lib/use-remote-list";
import {
  DataTable,
  EmptyState,
  ListError,
  PageHeader,
  Pagination,
  SegmentedTabs,
  primaryActionClass,
  secondaryActionClass,
  type Column,
} from "@/shared/ui/data-list";
import { DatePicker } from "@/shared/ui/kit/date-picker";
import { Layout } from "@/widgets/layout";
import { dayRange, fetchStockOptions, fetchTransactions, formatDateTime, PAGE_SIZE } from "../model/load-transactions";

type StatusTab = TransactionStatus | "ALL";

const statusTabs: StatusTab[] = ["ALL", "PROCESSING", "COMPLETED", "COMPENSATED", "FAILED"];
const tabOptions = statusTabs.map((value) => ({ value, label: value === "ALL" ? "Todas" : transactionStatusLabel(value) }));

const typeLabel: Record<TransactionSummary["type"], string> = {
  SALE: "Saída",
  PURCHASE_RECEIPT: "Entrada",
  TRANSFER: "Transferência",
  RETURN: "Devolução",
  ADJUSTMENT: "Ajuste",
};

const columns: Column<TransactionSummary>[] = [
  {
    id: "code",
    header: "Transação",
    cell: (tx) => (
      <span className="grid">
        <span className="font-mono text-[13px] font-medium">{tx.code}</span>
        {tx.externalRef && <span className="text-[12.5px] font-normal text-white/55">{tx.externalRef}</span>}
      </span>
    ),
  },
  { id: "type", header: "Tipo", className: "text-white/70", cell: (tx) => typeLabel[tx.type] },
  { id: "status", header: "Status", cell: (tx) => <TransactionStatusBadge status={tx.status} /> },
  { id: "items", header: "Itens", className: "whitespace-nowrap text-white/70", cell: (tx) => `${tx.itemCount} · ${tx.totalQuantity} un` },
  { id: "by", header: "Iniciado por", hideBelow: "lg", className: "font-mono text-[12.5px] text-white/60", cell: (tx) => tx.initiatedBy.slice(0, 8) },
  { id: "created", header: "Criado em", className: "whitespace-nowrap text-white/60", cell: (tx) => formatDateTime(tx.createdAt) },
  {
    id: "reason",
    header: "Motivo",
    hideBelow: "xl",
    className: "max-w-[260px] text-white/60",
    cell: (tx) => <span className="block truncate" title={tx.failureReason ?? undefined}>{tx.failureReason ?? "—"}</span>,
  },
];

// Lista de transações (sagas orquestradas pelo Temporal).
export function TransactionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StatusTab>("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stockOptions, setStockOptions] = useState<TransactionStockOption[]>([]);
  const [stockLoading, setStockLoading] = useState(false);

  const { items, total, loading, error, reload, refresh } = useRemoteList(
    () => fetchTransactions({ status: activeTab === "ALL" ? undefined : activeTab, page, ...dayRange(from, to) }),
    [activeTab, from, to, page],
  );

  // Sagas em andamento mudam de estado sozinhas: atualiza até todas terminarem.
  usePolling(reload, 3_000, items.some((item) => !isTerminalStatus(item.status)));

  const openDialog = async () => {
    setDialogOpen(true);
    setStockLoading(true);
    try {
      setStockOptions(await fetchStockOptions());
    } catch {
      setStockOptions([]);
    } finally {
      setStockLoading(false);
    }
  };

  const reset = <T,>(set: (value: T) => void) => (value: T) => { set(value); setPage(1); };

  return (
    <Layout title="Transações">
      <PageHeader
        title="Transações"
        description="Operações coordenadas em etapas, com compensação automática em caso de falha."
        actions={
          <>
            <button type="button" onClick={() => void refresh()} aria-label="Atualizar lista" className={`${secondaryActionClass} !px-0 w-11`}>
              <RefreshCw size={16} aria-hidden className={loading ? "animate-spin motion-reduce:animate-none" : undefined} />
            </button>
            <button type="button" onClick={() => void openDialog()} className={primaryActionClass}><Plus size={17} aria-hidden /> Nova transação</button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <SegmentedTabs label="Filtrar por status" value={activeTab} onChange={reset(setActiveTab)} options={tabOptions} />
        <div className="flex items-center gap-2">
          <DatePicker aria-label="Data inicial" placeholder="Data inicial" value={from} max={to || undefined} onChange={reset(setFrom)} className="h-11" />
          <span aria-hidden className="text-white/45">–</span>
          <DatePicker aria-label="Data final" placeholder="Data final" value={to} min={from || undefined} onChange={reset(setTo)} className="h-11" />
        </div>
      </div>

      {error && <ListError message={error} onRetry={() => void refresh()} />}

      <DataTable
        caption="Lista de transações"
        columns={columns}
        rows={items}
        getRowKey={(tx) => tx.id}
        rowHref={(tx) => `/transactions/${tx.id}` as Route}
        loading={loading}
        minWidth={900}
        empty={
          !error && (
            <EmptyState
              icon={ArrowLeftRight}
              message={<>Nenhuma transação encontrada. Use <strong className="font-semibold text-foreground">Nova transação</strong> para iniciar uma saga.</>}
            />
          )
        }
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} noun={["transação", "transações"]} />

      {dialogOpen && (
        <StartTransactionDialog
          items={stockOptions}
          loading={stockLoading}
          onClose={() => setDialogOpen(false)}
          onStarted={(transaction) => {
            setDialogOpen(false);
            router.push(`/transactions/${transaction.id}` as Route);
          }}
        />
      )}
    </Layout>
  );
}
