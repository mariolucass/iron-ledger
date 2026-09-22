"use client";

import { colors as theme } from "@/shared/config/tokens";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  GitBranch,
  Plus,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { staggerContainer, staggerItem } from "@/shared/lib/animation";
import { statusTabs, transactions, txDetail } from "@/features/(operations)/transactions/model/transactionsData";
import { Layout } from "@/widgets/layout/Layout";
import { StatusBadge } from "@/shared/ui/status-badge";

// 1. Tema "Cryptix" Integrado

// Dados mockados carregados do arquivo externo

const workflowStatusColor = (s: string) => {
  if (s === "CONCLUÍDO") return theme.accent;
  if (s === "EM_ANDAMENTO") return theme.info;
  if (s === "FALHA") return theme.danger;
  if (s === "COMPENSANDO") return theme.warning;
  if (s === "COMPENSADO") return "#fb923c";
  return theme.textSecondary;
};

// ============================================================================
// PAGE: Detalhes da Transação
// ============================================================================
export function TransactionDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const tx = transactions.find((t) => t.id === id) ?? transactions[3];

  const showCompensation = ["COMPENSANDO", "COMPENSADO", "FALHA"].includes(
    tx.status,
  );

  return (
    <Layout title="Detalhes da Transação">
      <button
        onClick={() => router.push("/transactions")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "transparent",
          border: "none",
          color: theme.textSecondary,
          cursor: "pointer",
          fontSize: 13,
          marginBottom: 24,
          padding: 0,
          transition: "color 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.color = theme.textPrimary)}
        onMouseOut={(e) => (e.currentTarget.style.color = theme.textSecondary)}
      >
        <ArrowLeft size={16} /> Voltar para Transações
      </button>

      {/* Cabeçalho */}
      <div
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: 32,
          marginBottom: 24,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow de fundo dependendo do status */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 120,
            height: 120,
            background: workflowStatusColor(tx.workflow),
            filter: "blur(60px)",
            opacity: 0.15,
            pointerEvents: "none",
          }}
        />

        <div>
          <div
            style={{
              fontSize: 11,
              color: theme.textSecondary,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            ID da Transação
          </div>
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: 28,
              fontWeight: 700,
              color: theme.textPrimary,
              marginBottom: 16,
            }}
          >
            {tx.id}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <StatusBadge
              status={tx.status}
              pulse={tx.status === "PROCESSANDO" || tx.status === "COMPENSANDO"}
            />
            <span
              style={{
                fontSize: 13,
                color: theme.textSecondary,
                fontWeight: 500,
              }}
            >
              {tx.type}
            </span>
            <span
              style={{
                fontSize: 13,
                color: theme.textSecondary,
                fontFamily: "var(--font-jetbrains-mono)",
              }}
            >
              {tx.createdAt}
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(0,0,0,0.2)",
            padding: "10px 16px",
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
          }}
        >
          <span style={{ fontSize: 13, color: theme.textSecondary }}>
            Iniciado por:{" "}
            <strong style={{ color: theme.textPrimary, fontWeight: 600 }}>
              {tx.by}
            </strong>
          </span>
        </div>
      </div>

      {/* Duas colunas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: 24,
          marginBottom: 24,
        }}
      >
        {/* Itens */}
        <div
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "16px 24px",
              borderBottom: `1px solid ${theme.border}`,
              fontSize: 14,
              fontWeight: 600,
              background: "rgba(0,0,0,0.2)",
            }}
          >
            Itens ({txDetail.items.length})
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {["SKU", "Produto", "Qtd"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 24px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 600,
                        color: theme.textSecondary,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <motion.tbody
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                {txDetail.items.map((item) => (
                  <motion.tr
                    variants={staggerItem}
                    key={item.sku}
                    style={{ borderBottom: `1px solid ${theme.border}` }}
                  >
                    <td
                      style={{
                        padding: "16px 24px",
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: 12,
                        color: theme.textSecondary,
                      }}
                    >
                      {item.sku}
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        color: theme.textPrimary,
                        fontWeight: 500,
                      }}
                    >
                      {item.name}
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        fontWeight: 700,
                        color: theme.textPrimary,
                        fontFamily: "var(--font-jetbrains-mono)",
                      }}
                    >
                      {item.qty}
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </div>

        {/* Linha do Tempo do Fluxo (Workflow) */}
        <div
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            padding: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 24,
              fontSize: 14,
              fontWeight: 600,
              color: theme.textPrimary,
            }}
          >
            <GitBranch size={16} color={theme.accent} /> Linha do Tempo do Fluxo
          </div>

          <div style={{ position: "relative", paddingLeft: 8 }}>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {txDetail.workflow.map((step, i) => {
                const color = workflowStatusColor(step.status);
                const isPending = step.status === "PENDENTE";
                return (
                  <motion.div
                    variants={staggerItem}
                    key={step.name}
                    style={{
                      display: "flex",
                      gap: 20,
                      position: "relative",
                      paddingBottom: i < txDetail.workflow.length - 1 ? 24 : 0,
                    }}
                  >
                    {/* Linha + Ponto */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        position: "absolute",
                        left: 0,
                        top: 4,
                        bottom: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: isPending ? theme.bg : color,
                          border: `2px solid ${isPending ? theme.border : color}`,
                          zIndex: 2,
                          boxShadow: !isPending
                            ? `0 0 10px ${color}40`
                            : "none",
                        }}
                      />
                      {i < txDetail.workflow.length - 1 && (
                        <div
                          style={{
                            width: 2,
                            flex: 1,
                            background: theme.border,
                            marginTop: 4,
                          }}
                        />
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div
                      style={{ paddingLeft: 24, opacity: isPending ? 0.5 : 1 }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: theme.textPrimary,
                          marginBottom: 4,
                        }}
                      >
                        {step.name}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: color,
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                          }}
                        >
                          {step.status}
                        </span>
                        {step.ts && (
                          <span
                            style={{
                              fontSize: 11,
                              color: theme.textSecondary,
                              fontFamily: "var(--font-jetbrains-mono)",
                            }}
                          >
                            {step.ts}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>

      {showCompensation && (
        <div
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            padding: 32,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 20,
              fontSize: 14,
              fontWeight: 600,
              color: theme.warning,
            }}
          >
            <Undo2 size={16} /> Detalhes da Compensação Automática (Saga
            Rollback)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {txDetail.compensations.map((c) => (
              <div
                key={c.step}
                style={{
                  background: theme.bg,
                  border: `1px solid ${theme.border}`,
                  borderLeft: `4px solid ${c.success ? theme.accent : theme.danger}`,
                  borderRadius: 8,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: theme.textPrimary,
                      marginBottom: 6,
                    }}
                  >
                    {c.step}
                  </div>
                  <div style={{ fontSize: 13, color: theme.textSecondary }}>
                    {c.reason}
                  </div>
                </div>
                <span
                  style={{
                    background: c.success ? theme.accentGlow : theme.dangerGlow,
                    color: c.success ? theme.accent : theme.danger,
                    borderRadius: 999,
                    padding: "4px 12px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    flexShrink: 0,
                  }}
                >
                  {c.success ? "SUCESSO" : "FALHA"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => router.push("/audit-log")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          padding: "14px 20px",
          color: theme.textPrimary,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 500,
          transition: "all 0.2s",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.borderColor = theme.accent;
          e.currentTarget.style.background = theme.accentGlow;
          e.currentTarget.style.color = theme.accent;
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.borderColor = theme.border;
          e.currentTarget.style.background = theme.surface;
          e.currentTarget.style.color = theme.textPrimary;
        }}
      >
        <ExternalLink size={16} /> Ver todos os eventos de auditoria desta
        transação (Kafka Log)
      </button>
    </Layout>
  );
}

// ============================================================================
// PAGE: Lista de Transações
// ============================================================================
export function TransactionsPage() {
  const [activeTab, setActiveTab] = useState("Todos");
  const router = useRouter();

  const filtered = transactions.filter((tx) => {
    if (activeTab === "Todos") return true;
    return tx.status.toLowerCase() === activeTab.toLowerCase();
  });

  const inputStyle = {
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: "8px 14px",
    color: theme.textPrimary,
    fontSize: 13,
    outline: "none",
    transition: "all 0.2s",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
  };

  return (
    <Layout title="Transações">
      <style>{`
        ::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; opacity: 0.6; transition: 0.2s; }
        ::-webkit-calendar-picker-indicator:hover { opacity: 1; }
      `}</style>

      {/* Abas + ações */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        {/* Tabs de Filtro */}
        <div
          style={{
            display: "flex",
            gap: 4,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 10,
            padding: 6,
          }}
        >
          {statusTabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  background: isActive ? theme.surfaceHover : "transparent",
                  border: "none",
                  color: isActive ? theme.textPrimary : theme.textSecondary,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  transition: "all 0.2s ease",
                  boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
                }}
                onMouseOver={(e) => {
                  if (!isActive)
                    e.currentTarget.style.color = theme.textPrimary;
                }}
                onMouseOut={(e) => {
                  if (!isActive)
                    e.currentTarget.style.color = theme.textSecondary;
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Date Pickers & CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: "2px 12px",
            }}
          >
            <Calendar size={14} color={theme.textSecondary} />
            <input
              type="date"
              defaultValue="2026-06-01"
              style={{
                ...inputStyle,
                border: "none",
                background: "transparent",
                padding: "6px 0",
                boxShadow: "none",
              }}
            />
            <span style={{ color: theme.textSecondary }}>-</span>
            <input
              type="date"
              defaultValue="2026-06-09"
              style={{
                ...inputStyle,
                border: "none",
                background: "transparent",
                padding: "6px 0",
                boxShadow: "none",
              }}
            />
          </div>

          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: theme.accent,
              color: "#000",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: `0 0 16px ${theme.accentGlow}`,
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "translateY(-2px)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
          >
            <Plus size={16} /> Nova transação
          </button>
        </div>
      </div>

      {/* Tabela Principal */}
      <div
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              minWidth: "900px",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: `1px solid ${theme.border}`,
                  background: "rgba(0,0,0,0.2)",
                }}
              >
                {[
                  "ID da Transação",
                  "Tipo",
                  "Status",
                  "Itens",
                  "Iniciado Por",
                  "Criado Em",
                  "Estado do Fluxo",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "16px 24px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      color: theme.textSecondary,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <motion.tbody
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              <AnimatePresence>
                {filtered.map((tx) => (
                  <motion.tr
                    variants={staggerItem}
                    whileHover={{ backgroundColor: theme.surfaceHover }}
                    key={tx.id}
                    onClick={() => router.push(`/transactions/${tx.id}`)}
                    style={{
                      borderBottom: `1px solid ${theme.border}`,
                      cursor: "pointer",
                    }}
                  >
                    <td
                      style={{
                        padding: "16px 24px",
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: 12,
                        color: theme.textPrimary,
                        fontWeight: 500,
                      }}
                    >
                      {tx.id}
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        color: theme.textSecondary,
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      {tx.type}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <StatusBadge
                        status={tx.status}
                        pulse={
                          tx.status === "PROCESSANDO" ||
                          tx.status === "COMPENSANDO"
                        }
                      />
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        color: theme.textSecondary,
                        fontFamily: "var(--font-jetbrains-mono)",
                      }}
                    >
                      {tx.items}
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        color: theme.textSecondary,
                      }}
                    >
                      {tx.by}
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        color: theme.textSecondary,
                        fontSize: 12,
                        fontFamily: "var(--font-jetbrains-mono)",
                      }}
                    >
                      {tx.createdAt}
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: 12 }}>
                      <span
                        style={{
                          color: workflowStatusColor(tx.workflow),
                          fontWeight: 600,
                          letterSpacing: "0.03em",
                        }}
                      >
                        {tx.workflow}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
