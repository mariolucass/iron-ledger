"use client";

import { colors as theme } from "@/shared/config/tokens";
import { motion } from "framer-motion";
import { ExternalLink, GitBranch, History, Loader2, Undo2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { staggerContainer, staggerItem } from "@/shared/lib/animation";
import { usePolling } from "@/shared/lib/use-polling";
import { ApiError } from "@/shared/api/client";
import {
  isTerminalStatus,
  SagaStepStatusBadge,
  sagaStepLabel,
  TransactionStatusBadge,
  transactionStatusLabel,
  type SagaStep,
  type TransactionDetail,
} from "@/entities/transaction";
import { PageHeader } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";
import { fetchTransaction, formatDateTime, stepDuration } from "../model/load-transaction";

const stepColor = (step: SagaStep) => {
  if (step.status === "SUCCEEDED") return step.kind === "COMPENSATION" ? theme.warning : theme.accent;
  if (step.status === "RUNNING" || step.status === "SCHEDULED") return theme.info;
  if (step.status === "FAILED" || step.status === "TIMED_OUT") return theme.danger;
  return theme.textSecondary;
};

const statusGlow: Record<TransactionDetail["status"], string> = {
  PENDING: theme.textSecondary,
  PROCESSING: theme.info,
  COMPENSATING: theme.warning,
  COMPLETED: theme.accent,
  COMPENSATED: theme.warning,
  FAILED: theme.danger,
  CANCELLED: theme.textSecondary,
};

const panel = { background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12 } as const;
const heading = { display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, color: theme.textPrimary } as const;
const label = { fontSize: 11, color: theme.textSecondary, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" } as const;
const mono = { fontFamily: "var(--font-jetbrains-mono)" } as const;

export function TransactionDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const [tx, setTx] = useState<TransactionDetail | null>(null);
  const [error, setError] = useState<{ message: string; notFound: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      setTx(await fetchTransaction(id));
      setError(null);
    } catch (reason) {
      const notFound = reason instanceof ApiError && (reason.status === 404 || reason.status === 422);
      setError({ message: reason instanceof Error ? reason.message : "Não foi possível consultar a transação.", notFound });
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);
  // A Saga avança no worker; enquanto não terminar, a tela acompanha.
  usePolling(load, 2_000, !!tx && !isTerminalStatus(tx.status));

  const backLink = { href: "/transactions" as Route, label: "Transações" };

  if (!tx) {
    return (
      <Layout title="Detalhes da Transação">
        <PageHeader back={backLink} title="Detalhes da transação" />
        {error
          ? <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive-soft px-4 py-3 text-sm text-destructive">{error.notFound ? "Transação não encontrada." : error.message}</div>
          : <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={14} className="animate-spin" />Carregando transação…</div>}
      </Layout>
    );
  }

  const compensations = tx.steps.filter((step) => step.kind === "COMPENSATION");
  const failedSteps = tx.steps.filter((step) => step.status === "FAILED");
  const showCompensation = compensations.length > 0 || tx.status === "COMPENSATED" || tx.status === "COMPENSATING";

  return (
    <Layout title="Detalhes da Transação">
      {error && <div role="status" className="mb-4 rounded-lg border border-warning/40 bg-warning-soft px-4 py-2 text-xs text-warning">Atualização falhou: {error.message}</div>}

      <PageHeader
        back={backLink}
        title={tx.code}
        badges={<TransactionStatusBadge status={tx.status} />}
        meta={<>{formatDateTime(tx.createdAt)}{tx.completedAt && <> · Finalizada {formatDateTime(tx.completedAt)}</>}</>}
        description={tx.failureReason ? <span className={tx.status === "FAILED" ? "text-destructive" : "text-warning"}>{tx.failureReason}</span> : undefined}
      />

      {/* Identificadores do workflow */}
      <div style={{ ...panel, padding: "20px 24px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, background: statusGlow[tx.status], filter: "blur(60px)", opacity: 0.15, pointerEvents: "none" }} />
        <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 16px", fontSize: 12, background: "rgba(0,0,0,0.2)", padding: "14px 18px", borderRadius: 8, border: `1px solid ${theme.border}` }}>
          <dt style={{ color: theme.textSecondary }}>Workflow</dt><dd style={{ ...mono, color: theme.textPrimary }}>{tx.workflowId}</dd>
          <dt style={{ color: theme.textSecondary }}>Run</dt><dd style={{ ...mono, color: theme.textPrimary }}>{tx.workflowRunId ?? "—"}</dd>
          <dt style={{ color: theme.textSecondary }}>Correlação</dt><dd style={{ ...mono, color: theme.textPrimary }}>{tx.correlationId ?? "—"}</dd>
          <dt style={{ color: theme.textSecondary }}>Iniciado por</dt><dd style={{ ...mono, color: theme.textPrimary }}>{tx.initiatedBy}</dd>
          {tx.externalRef && <><dt style={{ color: theme.textSecondary }}>Referência</dt><dd style={{ ...mono, color: theme.textPrimary }}>{tx.externalRef}</dd></>}
        </dl>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", gap: 24, marginBottom: 24 }}>
        {/* Itens */}
        <div style={{ ...panel, overflow: "hidden" }}>
          <div style={{ ...heading, padding: "16px 24px", borderBottom: `1px solid ${theme.border}`, background: "rgba(0,0,0,0.2)" }}>Itens ({tx.items.length})</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {["SKU", "Qtd", "Situação", "Reserva", "Movimento"].map((h) => (
                    <th key={h} style={{ ...label, padding: "12px 24px", textAlign: "left", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tx.items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ ...mono, padding: "16px 24px", fontSize: 12, color: theme.textPrimary }}>{item.sku}</td>
                    <td style={{ ...mono, padding: "16px 24px", fontWeight: 700, color: theme.textPrimary }}>{item.quantity}</td>
                    <td style={{ padding: "16px 24px", color: theme.textSecondary, fontSize: 12 }}>{item.status}</td>
                    <td style={{ ...mono, padding: "16px 24px", fontSize: 11, color: theme.textSecondary }}>{item.reservationId?.slice(0, 8) ?? "—"}</td>
                    <td style={{ ...mono, padding: "16px 24px", fontSize: 11, color: theme.textSecondary }}>{item.movementId?.slice(0, 8) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Linha do tempo da Saga */}
        <div style={{ ...panel, padding: 32 }}>
          <div style={{ ...heading, marginBottom: 24 }}><GitBranch size={16} color={theme.accent} /> Linha do Tempo da Saga</div>
          {tx.steps.length === 0 && (
            <p className="text-sm text-muted-foreground">{isTerminalStatus(tx.status) ? "Nenhum passo registrado." : "Aguardando o worker iniciar a Saga…"}</p>
          )}
          <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ position: "relative", paddingLeft: 8 }}>
            {tx.steps.map((step, index) => {
              const color = stepColor(step);
              const duration = stepDuration(step);
              return (
                <motion.div variants={staggerItem} key={step.id} style={{ display: "flex", gap: 20, position: "relative", paddingBottom: index < tx.steps.length - 1 ? 24 : 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "absolute", left: 0, top: 4, bottom: 0 }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: color, border: `2px solid ${color}`, zIndex: 2, boxShadow: `0 0 10px ${color}40` }} />
                    {index < tx.steps.length - 1 && <div style={{ width: 2, flex: 1, background: theme.border, marginTop: 4 }} />}
                  </div>
                  <div style={{ paddingLeft: 24, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: theme.textPrimary }}>{step.sequence}. {sagaStepLabel(step.name)}</span>
                      {step.kind === "COMPENSATION" && <span style={{ fontSize: 10, fontWeight: 700, color: theme.warning, letterSpacing: "0.05em" }}>COMPENSAÇÃO</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <SagaStepStatusBadge status={step.status} />
                      <span style={{ ...mono, fontSize: 11, color: theme.textSecondary }}>{formatDateTime(step.startedAt)}</span>
                      {duration && <span style={{ ...mono, fontSize: 11, color: theme.textSecondary }}>{duration}</span>}
                    </div>
                    {step.error && <p style={{ marginTop: 6, fontSize: 12, color: theme.danger, wordBreak: "break-word" }}>{step.error}</p>}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {showCompensation && (
        <div style={{ ...panel, padding: 32, marginBottom: 24 }}>
          <div style={{ ...heading, marginBottom: 20, color: theme.warning }}><Undo2 size={16} /> Compensação automática (Saga rollback)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {failedSteps.map((step) => (
              <div key={step.id} style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderLeft: `4px solid ${theme.danger}`, borderRadius: 8, padding: "16px 20px" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.textPrimary, marginBottom: 6 }}>Gatilho: {sagaStepLabel(step.name)} falhou</div>
                <div style={{ fontSize: 13, color: theme.textSecondary }}>{step.error ?? "Sem detalhes."}</div>
              </div>
            ))}
            {compensations.map((step) => (
              <div key={step.id} style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderLeft: `4px solid ${step.status === "SUCCEEDED" ? theme.accent : step.status === "FAILED" ? theme.danger : theme.info}`, borderRadius: 8, padding: "16px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: theme.textPrimary, marginBottom: 6 }}>{sagaStepLabel(step.name)}</div>
                  <div style={{ fontSize: 13, color: theme.textSecondary }}>
                    {step.status === "SUCCEEDED" ? "Reserva liberada; o saldo voltou ao disponível." : step.error ?? "Em andamento."}
                  </div>
                </div>
                <SagaStepStatusBadge status={step.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico de estados */}
      <div style={{ ...panel, padding: 32, marginBottom: 24 }}>
        <div style={{ ...heading, marginBottom: 16 }}><History size={16} color={theme.info} /> Histórico de estados</div>
        <ol className="grid gap-2 text-sm">
          {tx.history.map((change, index) => (
            <li key={`${change.changedAt}-${index}`} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span style={{ ...mono, fontSize: 11, color: theme.textSecondary, minWidth: 150 }}>{formatDateTime(change.changedAt)}</span>
              <span className="text-muted-foreground">{change.fromStatus ? transactionStatusLabel(change.fromStatus) : "—"} →</span>
              <span className="font-semibold text-foreground">{transactionStatusLabel(change.toStatus)}</span>
              {change.reason && <span className="text-xs text-muted-foreground">{change.reason}</span>}
            </li>
          ))}
        </ol>
      </div>

      <button
        onClick={() => router.push("/audit-log")}
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary"
      >
        <ExternalLink size={16} /> Ver eventos de auditoria (correlação {tx.correlationId?.slice(0, 8) ?? tx.id.slice(0, 8)})
      </button>
    </Layout>
  );
}
