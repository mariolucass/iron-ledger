"use client";

import { colors as theme } from "@/shared/config/tokens";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Filter,
  Package,
  Plus,
  Search,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem, spring1 } from "@/shared/lib/animation";
import {
  InventoryItem,
  movementHistory,
} from "@/features/(operations)/inventory/model/inventoryData";
import { Layout } from "@/widgets/layout/Layout";

// 1. Tema "Cryptix" Integrado

// 2. Dados carregados do arquivo externo

// 3. Sub-componentes e Helpers Visuais
const statusColor = (status: string) => {
  if (status === "CRITICAL")
    return {
      bg: theme.dangerGlow,
      color: theme.danger,
      border: `${theme.danger}40`,
    };
  if (status === "LOW")
    return {
      bg: theme.warningGlow,
      color: theme.warning,
      border: `${theme.warning}40`,
    };
  return {
    bg: theme.accentGlow,
    color: theme.accent,
    border: `${theme.accent}40`,
  };
};

const movColor = (type: string) => {
  if (type === "ENTRADA") return { bg: theme.accentGlow, color: theme.accent };
  if (type === "SAÍDA") return { bg: theme.dangerGlow, color: theme.danger };
  return { bg: theme.warningGlow, color: theme.warning }; // AJUSTE
};

function InventoryDrawer({
  item,
  onClose,
}: {
  item: InventoryItem;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={spring1}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 480,
          background: theme.bg,
          borderLeft: `1px solid ${theme.border}`,
          padding: 32,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 32,
          boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Package size={14} color={theme.textSecondary} />
              <span
                style={{
                  fontSize: 11,
                  color: theme.textSecondary,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Detalhes do SKU
              </span>
            </div>
            <h2
              style={{
                margin: "0 0 6px",
                fontSize: 20,
                fontWeight: 700,
                color: theme.textPrimary,
              }}
            >
              {item.product}
            </h2>
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 13,
                color: theme.accent,
              }}
            >
              {item.sku}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.textSecondary,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = theme.textPrimary;
              e.currentTarget.style.color = theme.textPrimary;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = theme.border;
              e.currentTarget.style.color = theme.textSecondary;
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* KPIs Grid */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          {[
            { label: "Depósito", value: item.warehouse },
            { label: "Último Movimento", value: item.lastMovement },
            {
              label: "Disponível",
              value: item.available,
              highlight:
                item.status !== "OK"
                  ? item.status === "CRITICAL"
                    ? theme.danger
                    : theme.warning
                  : theme.textPrimary,
            },
            { label: "Reservado", value: item.reserved },
          ].map(({ label, value, highlight }) => (
            <div
              key={label}
              style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                padding: "16px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: theme.textSecondary,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 6,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontFamily:
                    typeof value === "number" || value.includes("-")
                      ? "var(--font-jetbrains-mono)"
                      : "inherit",
                  color: highlight || theme.textPrimary,
                  fontWeight: 600,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Histórico */}
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: theme.textSecondary,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Histórico de Movimentações
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(movementHistory[item.sku] ?? []).length === 0 ? (
              <div
                style={{
                  color: theme.textSecondary,
                  fontSize: 13,
                  padding: 16,
                  textAlign: "center",
                  background: theme.surface,
                  borderRadius: 8,
                }}
              >
                Nenhuma movimentação recente encontrada.
              </div>
            ) : (
              (movementHistory[item.sku] ?? []).map((m, i) => {
                const colors = movColor(m.type);
                return (
                  <div
                    key={i}
                    style={{
                      background: theme.surface,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                      padding: "12px 16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          background: colors.bg,
                          color: colors.color,
                          borderRadius: 999,
                          padding: "2px 10px",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {m.type}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-jetbrains-mono)",
                          fontWeight: 700,
                          fontSize: 14,
                          color: m.qty.startsWith("+")
                            ? theme.accent
                            : theme.danger,
                        }}
                      >
                        {m.qty}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: theme.textSecondary,
                        fontFamily: "var(--font-jetbrains-mono)",
                        marginBottom: 4,
                      }}
                    >
                      Ref: {m.ref}
                    </div>
                    <div style={{ fontSize: 11, color: theme.textSecondary }}>
                      Por: {m.by} <span style={{ opacity: 0.5 }}>·</span> {m.ts}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <button
          style={{
            marginTop: "auto",
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            padding: "12px",
            fontSize: 13,
            color: theme.textPrimary,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = theme.accent;
            e.currentTarget.style.color = theme.accent;
            e.currentTarget.style.background = theme.accentGlow;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = theme.border;
            e.currentTarget.style.color = theme.textPrimary;
            e.currentTarget.style.background = theme.surface;
          }}
        >
          <ExternalLink size={14} />
          Ver no Log de Auditoria
        </button>
      </motion.div>
    </div>
  );
}

// 4. Componente Principal
export function InventoryPage() {
  const [search, setSearch] = useState("");
  const [warehouse, setWarehouse] = useState("all");
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [warehouseOptions, setWarehouseOptions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<InventoryItem | null>(null);

  useEffect(() => {
    let active = true;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
    fetch(`${apiUrl}/inventory`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Não foi possível consultar o inventário.");
        return response.json();
      })
      .then((result: { data: InventoryItem[]; warehouses: { id: string; name: string }[] }) => {
        if (!active) return;
        setInventoryData(result.data);
        setWarehouseOptions(result.warehouses);
        setLoadError(null);
      })
      .catch(() => { if (active) setLoadError("Não foi possível carregar os saldos. Verifique se a API está disponível."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = inventoryData.filter(
    (r) =>
      (warehouse === "all" || r.warehouseId === warehouse) &&
      (r.sku.toLowerCase().includes(search.toLowerCase()) ||
        r.product.toLowerCase().includes(search.toLowerCase())),
  );

  const inputStyle = {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: "8px 14px",
    color: theme.textPrimary,
    fontSize: 13,
    outline: "none",
    transition: "all 0.2s",
  };
  const inputFocus = (e: any) => {
    e.currentTarget.style.borderColor = theme.accent;
    e.currentTarget.style.boxShadow = `0 0 0 1px ${theme.accent}`;
  };
  const inputBlur = (e: any) => {
    e.currentTarget.style.borderColor = theme.border;
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <Layout title="Controle de Estoque">
      <style>{`
        @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* Top bar / Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div
          style={{
            flex: 1,
            minWidth: 260,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: theme.bg,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            padding: "0 14px",
            transition: "all 0.2s",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
          }}
          onFocus={inputFocus}
          onBlur={inputBlur}
        >
          <Search size={16} color={theme.textSecondary} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por SKU ou nome..."
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: theme.textPrimary,
              fontSize: 13,
              width: "100%",
              padding: "10px 0",
            }}
          />
        </div>

        {/* Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Filter size={14} color={theme.textSecondary} />
          <select
            value={warehouse}
            onChange={(e) => setWarehouse(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer", width: 180 }}
            onFocus={inputFocus}
            onBlur={inputBlur}
          >
            <option value="all" style={{ background: theme.bg }}>Todos os depósitos</option>
            {warehouseOptions.map((w) => (
              <option key={w.id} value={w.id} style={{ background: theme.bg }}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* CTA Neon */}
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
          <Plus size={16} /> Novo movimento
        </button>
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
                <th style={{ width: 48, padding: "16px" }} />
                {[
                  "SKU",
                  "Produto",
                  "Depósito",
                  "Saldo total",
                  "Disponível",
                  "Reservado",
                  "Estoque Mín",
                  "Status",
                  "Últ. Movimento",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "16px",
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
                {loading ? <tr><td colSpan={10} style={{ padding: 32, textAlign: "center", color: theme.textSecondary }}>Carregando inventário…</td></tr> : loadError ? <tr><td colSpan={10} style={{ padding: 32, textAlign: "center", color: theme.danger }}>{loadError}</td></tr> : filtered.length === 0 ? <tr><td colSpan={10} style={{ padding: 32, textAlign: "center", color: theme.textSecondary }}>Nenhum saldo encontrado para esta consulta.</td></tr> : filtered.map((row) => {
                const sColor = statusColor(row.status);
                const isExpanded = expanded === row.sku;

                return (
                  <React.Fragment key={row.sku}>
                    {/* Linha Principal */}
                    <motion.tr
                      variants={staggerItem}
                      style={{
                        borderBottom: `1px solid ${theme.border}`,
                        background:
                          row.status === "CRITICAL"
                            ? theme.dangerGlow
                            : "transparent",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onClick={() => setExpanded(isExpanded ? null : row.sku)}
                      onMouseOver={(e) => {
                        if (!isExpanded)
                          e.currentTarget.style.background = theme.surfaceHover;
                      }}
                      onMouseOut={(e) => {
                        if (!isExpanded)
                          e.currentTarget.style.background =
                            row.status === "CRITICAL"
                              ? theme.dangerGlow
                              : "transparent";
                      }}
                    >
                      <td
                        style={{
                          padding: "16px",
                          color: theme.textSecondary,
                          textAlign: "center",
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown size={16} color={theme.accent} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </td>
                      <td
                        style={{
                          padding: "16px",
                          fontFamily: "var(--font-jetbrains-mono)",
                          fontSize: 12,
                          color: theme.textSecondary,
                        }}
                      >
                        {row.sku}
                      </td>
                      <td
                        style={{
                          padding: "16px",
                          fontWeight: 600,
                          color: theme.textPrimary,
                        }}
                      >
                        {row.product}
                      </td>
                      <td
                        style={{ padding: "16px", color: theme.textSecondary }}
                      >
                        {row.warehouse}
                      </td>
                      <td style={{ padding: "16px", color: theme.textSecondary, fontFamily: "var(--font-jetbrains-mono)" }}>
                        {row.quantity} {row.unit ?? "un"}
                      </td>
                      <td
                        style={{
                          padding: "16px",
                          fontWeight: 700,
                          fontFamily: "var(--font-jetbrains-mono)",
                          color:
                            row.status !== "OK"
                              ? sColor.color
                              : theme.textPrimary,
                        }}
                      >
                        {row.available}
                      </td>
                      <td
                        style={{
                          padding: "16px",
                          color: theme.textSecondary,
                          fontFamily: "var(--font-jetbrains-mono)",
                        }}
                      >
                        {row.reserved}
                      </td>
                      <td
                        style={{
                          padding: "16px",
                          color: theme.textSecondary,
                          fontFamily: "var(--font-jetbrains-mono)",
                        }}
                      >
                        {row.min}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span
                          style={{
                            background: sColor.bg,
                            color: sColor.color,
                            border: `1px solid ${sColor.border}`,
                            borderRadius: 999,
                            padding: "2px 10px",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "16px",
                          color: theme.textSecondary,
                          fontSize: 12,
                          fontFamily: "var(--font-jetbrains-mono)",
                        }}
                      >
                        {row.lastMovement}
                      </td>
                    </motion.tr>

                    {/* Tabela Expandida (Nested) */}
                    {isExpanded && (
                      <tr style={{ background: "rgba(0,0,0,0.4)" }}>
                        <td colSpan={10} style={{ padding: 0 }}>
                          <div
                            style={{
                              padding: "24px 24px 24px 64px",
                              borderLeft: `2px solid ${theme.accent}`,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 12,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: theme.textSecondary,
                                  letterSpacing: "0.06em",
                                  textTransform: "uppercase",
                                }}
                              >
                                Últimos 5 Movimentos
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDrawer(row);
                                }}
                                style={{
                                  background: theme.surface,
                                  border: `1px solid ${theme.border}`,
                                  borderRadius: 6,
                                  padding: "6px 12px",
                                  color: theme.textPrimary,
                                  cursor: "pointer",
                                  fontSize: 12,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  transition: "all 0.2s",
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.borderColor =
                                    theme.accent;
                                  e.currentTarget.style.color = theme.accent;
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.borderColor =
                                    theme.border;
                                  e.currentTarget.style.color =
                                    theme.textPrimary;
                                }}
                              >
                                <ExternalLink size={12} /> Visualização Completa
                              </button>
                            </div>

                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                fontSize: 12,
                              }}
                            >
                              <thead>
                                <tr
                                  style={{
                                    borderBottom: `1px dashed ${theme.border}`,
                                  }}
                                >
                                  {[
                                    "Tipo",
                                    "Qtd",
                                    "Referência",
                                    "Por",
                                    "Data/Hora",
                                  ].map((h) => (
                                    <th
                                      key={h}
                                      style={{
                                        padding: "8px 12px",
                                        textAlign: "left",
                                        color: theme.textSecondary,
                                        fontSize: 11,
                                        fontWeight: 500,
                                      }}
                                    >
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(movementHistory[row.sku] ?? []).map(
                                  (m, i) => {
                                    const c = movColor(m.type);
                                    return (
                                      <tr
                                        key={i}
                                        style={{
                                          borderBottom:
                                            i ===
                                            (movementHistory[row.sku] ?? [])
                                              .length -
                                              1
                                              ? "none"
                                              : `1px dashed ${theme.border}`,
                                        }}
                                      >
                                        <td style={{ padding: "8px 12px" }}>
                                          <span
                                            style={{
                                              background: c.bg,
                                              color: c.color,
                                              borderRadius: 999,
                                              padding: "2px 8px",
                                              fontSize: 10,
                                              fontWeight: 600,
                                            }}
                                          >
                                            {m.type}
                                          </span>
                                        </td>
                                        <td
                                          style={{
                                            padding: "8px 12px",
                                            fontFamily:
                                              "var(--font-jetbrains-mono)",
                                            fontWeight: 700,
                                            color: m.qty.startsWith("+")
                                              ? theme.accent
                                              : theme.danger,
                                          }}
                                        >
                                          {m.qty}
                                        </td>
                                        <td
                                          style={{
                                            padding: "8px 12px",
                                            fontFamily:
                                              "var(--font-jetbrains-mono)",
                                            color: theme.textSecondary,
                                          }}
                                        >
                                          {m.ref}
                                        </td>
                                        <td
                                          style={{
                                            padding: "8px 12px",
                                            color: theme.textSecondary,
                                          }}
                                        >
                                          {m.by}
                                        </td>
                                        <td
                                          style={{
                                            padding: "8px 12px",
                                            fontFamily:
                                              "var(--font-jetbrains-mono)",
                                            color: theme.textSecondary,
                                          }}
                                        >
                                          {m.ts}
                                        </td>
                                      </tr>
                                    );
                                  },
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {drawer && (
          <InventoryDrawer item={drawer} onClose={() => setDrawer(null)} />
        )}
      </AnimatePresence>
    </Layout>
  );
}
