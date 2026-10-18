"use client";

import { colors as theme } from "@/shared/config/tokens";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Loader2, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { staggerContainer, staggerItem } from "@/shared/lib/animation";
import { usePolling } from "@/shared/lib/use-polling";
import {
  isTerminalStatus,
  TransactionStatusBadge,
  transactionStatusLabel,
  type TransactionStatus,
  type TransactionSummary,
} from "@/entities/transaction";
import { StartTransactionDialog, type TransactionStockOption } from "@/features/start-transaction";
import { Layout } from "@/widgets/layout";
import { dayRange, fetchStockOptions, fetchTransactions, formatDateTime, PAGE_SIZE } from "../model/load-transactions";

const statusTabs: Array<TransactionStatus | "ALL"> = ["ALL", "PROCESSING", "COMPLETED", "COMPENSATED", "FAILED"];
const typeLabel: Record<TransactionSummary["type"], string> = {
  SALE: "SAÍDA",
  PURCHASE_RECEIPT: "ENTRADA",
  TRANSFER: "TRANSFERÊNCIA",
  RETURN: "DEVOLUÇÃO",
  ADJUSTMENT: "AJUSTE",
};

// ============================================================================
// PAGE: Lista de Transações (Sagas orquestradas pelo Temporal)
// ============================================================================
export function TransactionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TransactionStatus | "ALL">("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<TransactionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stockOptions, setStockOptions] = useState<TransactionStockOption[]>([]);
  const [stockLoading, setStockLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const body = await fetchTransactions({
        status: activeTab === "ALL" ? undefined : activeTab,
        page,
        ...dayRange(from, to),
      });
      setItems(body.items);
      setTotal(body.total);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível consultar as transações.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, from, to, page]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  // Sagas em andamento mudam de estado sozinhas: atualiza até todas terminarem.
  usePolling(load, 3_000, items.some((item) => !isTerminalStatus(item.status)));

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

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const inputStyle = {
    background: "transparent",
    border: "none",
    padding: "6px 0",
    color: theme.textPrimary,
    fontSize: 13,
    outline: "none",
  };

  return (
    <Layout title="Transações">
      <style>{`
        ::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; opacity: 0.6; transition: 0.2s; }
        ::-webkit-calendar-picker-indicator:hover { opacity: 1; }
      `}</style>

      {/* Abas + ações */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div role="tablist" aria-label="Filtrar por status" style={{ display: "flex", gap: 4, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 6, flexWrap: "wrap" }}>
          {statusTabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                role="tab"
                aria-selected={isActive}
                onClick={() => { setActiveTab(tab); setPage(1); }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  background: isActive ? theme.surfaceHover : "transparent",
                  border: "none",
                  color: isActive ? theme.textPrimary : theme.textSecondary,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
                }}
              >
                {tab === "ALL" ? "Todas" : transactionStatusLabel(tab)}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "2px 12px" }}>
            <Calendar size={14} color={theme.textSecondary} />
            <input type="date" aria-label="Data inicial" value={from} max={to || undefined} onChange={(event) => { setFrom(event.target.value); setPage(1); }} style={inputStyle} />
            <span style={{ color: theme.textSecondary }}>-</span>
            <input type="date" aria-label="Data final" value={to} min={from || undefined} onChange={(event) => { setTo(event.target.value); setPage(1); }} style={inputStyle} />
          </div>

          <button
            onClick={() => { setLoading(true); void load(); }}
            aria-label="Atualizar lista"
            className="grid size-10 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : undefined} />
          </button>

          <button
            onClick={() => void openDialog()}
            style={{
              display: "flex", alignItems: "center", gap: 6, background: theme.accent, color: "#000", border: "none",
              borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: `0 0 16px ${theme.accentGlow}`,
            }}
          >
            <Plus size={16} /> Nova transação
          </button>
        </div>
      </div>

      {error && <div role="alert" className="mb-4 rounded-lg border border-destructive/40 bg-destructive-soft px-4 py-3 text-sm text-destructive">{error}</div>}

      {/* Tabela Principal */}
      <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: "900px" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.border}`, background: "rgba(0,0,0,0.2)" }}>
                {["Transação", "Tipo", "Status", "Itens", "Iniciado por", "Criado em", "Motivo"].map((h) => (
                  <th key={h} style={{ padding: "16px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: theme.textSecondary, letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <motion.tbody variants={staggerContainer} initial="hidden" animate="show">
              <AnimatePresence>
                {items.map((tx) => (
                  <motion.tr
                    variants={staggerItem}
                    whileHover={{ backgroundColor: theme.surfaceHover }}
                    key={tx.id}
                    onClick={() => router.push(`/transactions/${tx.id}`)}
                    style={{ borderBottom: `1px solid ${theme.border}`, cursor: "pointer" }}
                  >
                    <td style={{ padding: "16px 24px", fontFamily: "var(--font-jetbrains-mono)", fontSize: 12, color: theme.textPrimary, fontWeight: 500 }}>
                      {tx.code}
                      {tx.externalRef && <div style={{ color: theme.textSecondary, fontSize: 11 }}>{tx.externalRef}</div>}
                    </td>
                    <td style={{ padding: "16px 24px", color: theme.textSecondary, fontWeight: 500 }}>{typeLabel[tx.type]}</td>
                    <td style={{ padding: "16px 24px" }}><TransactionStatusBadge status={tx.status} /></td>
                    <td style={{ padding: "16px 24px", color: theme.textSecondary, fontFamily: "var(--font-jetbrains-mono)" }}>{tx.itemCount} · {tx.totalQuantity} un</td>
                    <td style={{ padding: "16px 24px", color: theme.textSecondary, fontFamily: "var(--font-jetbrains-mono)", fontSize: 11 }}>{tx.initiatedBy.slice(0, 8)}</td>
                    <td style={{ padding: "16px 24px", color: theme.textSecondary, fontSize: 12, fontFamily: "var(--font-jetbrains-mono)" }}>{formatDateTime(tx.createdAt)}</td>
                    <td style={{ padding: "16px 24px", color: theme.textSecondary, fontSize: 12, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={tx.failureReason ?? undefined}>{tx.failureReason ?? "—"}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>
        {!loading && items.length === 0 && !error && (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Nenhuma transação encontrada. Use <strong className="text-foreground">Nova transação</strong> para iniciar uma Saga.
          </div>
        )}
        {loading && items.length === 0 && (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-muted-foreground"><Loader2 size={14} className="animate-spin" />Carregando transações…</div>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-end gap-3 text-sm text-muted-foreground">
          <span>Página {page} de {pages} · {total} transações</span>
          <button aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="grid size-8 place-items-center rounded-md border border-border disabled:opacity-40"><ChevronLeft size={14} /></button>
          <button aria-label="Próxima página" disabled={page >= pages} onClick={() => setPage((current) => current + 1)} className="grid size-8 place-items-center rounded-md border border-border disabled:opacity-40"><ChevronRight size={14} /></button>
        </div>
      )}

      {dialogOpen && (
        <StartTransactionDialog
          items={stockOptions}
          loading={stockLoading}
          onClose={() => setDialogOpen(false)}
          onStarted={(transaction) => {
            setDialogOpen(false);
            router.push(`/transactions/${transaction.id}`);
          }}
        />
      )}
    </Layout>
  );
}
