"use client";

import { colors as theme } from "@/shared/config/tokens";
import { Calendar, Filter, Lock, Search, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem, spring1 } from "@/shared/lib/animation";
import { Layout } from "@/widgets/layout/Layout";

// 1. Tema "Cryptix" Integrado

// Mapeamento de cores para as ações do Log
const actionTheme: Record<
  string,
  { text: string; bg: string; border: string }
> = {
  CREATE: {
    text: theme.accent,
    bg: theme.accentGlow,
    border: `${theme.accent}40`,
  },
  UPDATE: {
    text: theme.info,
    bg: "rgba(59, 130, 246, 0.15)",
    border: "rgba(59, 130, 246, 0.4)",
  },
  DELETE: {
    text: theme.danger,
    bg: theme.dangerGlow,
    border: `${theme.danger}40`,
  },
  LOGIN: {
    text: theme.textPrimary,
    bg: theme.surfaceHover,
    border: theme.border,
  },
  PERMISSION_CHANGE: {
    text: theme.warning,
    bg: "rgba(245, 166, 35, 0.15)",
    border: "rgba(245, 166, 35, 0.4)",
  },
};

// Dicionário de tradução para exibição na interface
const actionLabels: Record<string, string> = {
  CREATE: "CRIAR",
  UPDATE: "ATUALIZAR",
  DELETE: "DELETAR",
  LOGIN: "LOGIN",
  PERMISSION_CHANGE: "ALTERAR PERMISSÃO",
};

const resourceLabels: Record<string, string> = {
  Inventory: "Inventário",
  Transaction: "Transação",
  User: "Usuário",
  Permission: "Permissão",
  System: "Sistema",
};

import {
  AuditEntry,
  actions,
  auditEntries,
  beforeAfterData,
  resourceTypes,
} from "@/features/(governance)/audit-log/model/auditData";

// 3. Sub-componentes
function ActionBadge({ action }: { action: string }) {
  const style = actionTheme[action] || actionTheme.LOGIN;
  const label = actionLabels[action] || action;
  return (
    <span
      style={{
        background: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        borderRadius: 999,
        padding: "2px 10px",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function DiffViewer({
  before,
  after,
}: {
  before: Record<string, any>;
  after: Record<string, any>;
}) {
  const allKeys = Array.from(
    new Set([...Object.keys(before), ...Object.keys(after)]),
  );

  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: theme.textSecondary,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Diferença de Alteração de Estado (Diff)
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1,
          borderRadius: 8,
          overflow: "hidden",
          border: `1px solid ${theme.border}`,
          background: theme.border,
        }}
      >
        {/* ANTES COLUMN */}
        <div style={{ background: theme.bg, padding: "16px" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: theme.danger,
              marginBottom: 12,
              letterSpacing: "0.05em",
            }}
          >
            ANTES
          </div>
          {allKeys.map((key) => {
            const changed =
              JSON.stringify(before[key]) !== JSON.stringify(after[key]);
            return (
              <div
                key={key}
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: 12,
                  marginBottom: 6,
                  background: changed ? theme.dangerGlow : "transparent",
                  padding: "4px 8px",
                  borderRadius: 4,
                  color: changed ? theme.danger : theme.textSecondary,
                }}
              >
                <span style={{ color: theme.textSecondary, opacity: 0.7 }}>
                  {key}:{" "}
                </span>
                {JSON.stringify(before[key] ?? "null")}
              </div>
            );
          })}
        </div>

        {/* DEPOIS COLUMN */}
        <div style={{ background: theme.bg, padding: "16px" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: theme.accent,
              marginBottom: 12,
              letterSpacing: "0.05em",
            }}
          >
            DEPOIS
          </div>
          {allKeys.map((key) => {
            const changed =
              JSON.stringify(before[key]) !== JSON.stringify(after[key]);
            return (
              <div
                key={key}
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: 12,
                  marginBottom: 6,
                  background: changed ? theme.accentGlow : "transparent",
                  padding: "4px 8px",
                  borderRadius: 4,
                  color: changed ? theme.accent : theme.textSecondary,
                }}
              >
                <span style={{ color: theme.textSecondary, opacity: 0.7 }}>
                  {key}:{" "}
                </span>
                {JSON.stringify(after[key] ?? "null")}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AuditDrawer({
  entry,
  onClose,
}: {
  entry: AuditEntry;
  onClose: () => void;
}) {
  const displayAction = actionLabels[entry.action] || entry.action;
  const displayResource = resourceLabels[entry.resource] || entry.resource;

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
          maxWidth: 600,
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
              <Lock size={14} color={theme.accent} />
              <span
                style={{
                  fontSize: 11,
                  color: theme.accent,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Registro Imutável
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 24,
                fontWeight: 700,
                color: theme.textPrimary,
                marginBottom: 8,
              }}
            >
              {displayAction}
            </div>
            <div style={{ fontSize: 14, color: theme.textSecondary }}>
              {displayResource} <span style={{ opacity: 0.5 }}>·</span>{" "}
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  color: theme.textPrimary,
                }}
              >
                {entry.resourceId}
              </span>
            </div>
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

        {/* Metadata Grid */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          {[
            { label: "Usuário", value: entry.user },
            { label: "Data/Hora", value: entry.ts },
            { label: "Endereço IP", value: "10.0.1.42" },
            { label: "User Agent", value: "Mozilla/5.0 (X11; Linux)" },
            {
              label: "ID do Rastreio (Trace ID)",
              value: "trc-" + entry.corrId.slice(5),
            },
            { label: "ID de Correlação", value: entry.corrId },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                padding: "12px 16px",
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
                  fontSize: 13,
                  fontFamily: "var(--font-jetbrains-mono)",
                  color: theme.textPrimary,
                  wordBreak: "break-all",
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        <DiffViewer
          before={beforeAfterData.before}
          after={beforeAfterData.after}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: theme.textSecondary,
            fontSize: 12,
            padding: "16px",
            background: "rgba(255,255,255,0.02)",
            borderRadius: 8,
            border: `1px dashed ${theme.border}`,
          }}
        >
          <Lock size={14} />
          <span>
            Este registro criptográfico é imutável e verificado por meio de
            anexo de log do Kafka.
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// 4. Componente Principal
export function AuditLogPage() {
  const [resourceType, setResourceType] = useState("Todos");
  const [action, setAction] = useState("Todas");
  const [corrSearch, setCorrSearch] = useState("");
  const [drawer, setDrawer] = useState<AuditEntry | null>(null);

  const filtered = auditEntries.filter(
    (e) =>
      (resourceType === "Todos" ||
        (resourceType === "Inventário" && e.resource === "Inventory") ||
        (resourceType === "Transação" && e.resource === "Transaction") ||
        (resourceType === "Usuário" && e.resource === "User") ||
        (resourceType === "Permissão" && e.resource === "Permission") ||
        (resourceType === "Sistema" && e.resource === "System")) &&
      (action === "Todas" ||
        (action === "CRIAR" && e.action === "CREATE") ||
        (action === "ATUALIZAR" && e.action === "UPDATE") ||
        (action === "DELETAR" && e.action === "DELETE") ||
        (action === "LOGIN" && e.action === "LOGIN") ||
        (action === "ALTERAR PERMISSÃO" && e.action === "PERMISSION_CHANGE")) &&
      (corrSearch === "" || e.corrId.includes(corrSearch)),
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
    <Layout title="Log de Auditoria">
      <style>{`
        @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        ::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; opacity: 0.6; transition: 0.2s; }
        ::-webkit-calendar-picker-indicator:hover { opacity: 1; }
      `}</style>

      {/* Control Bar (Filters) */}
      <div
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Filter size={16} color={theme.textSecondary} />
          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer", width: 140 }}
            onFocus={inputFocus}
            onBlur={inputBlur}
          >
            {resourceTypes.map((r) => (
              <option key={r} value={r} style={{ background: theme.bg }}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          style={{ ...inputStyle, cursor: "pointer", width: 180 }}
          onFocus={inputFocus}
          onBlur={inputBlur}
        >
          {actions.map((a) => (
            <option key={a} value={a} style={{ background: theme.bg }}>
              {a}
            </option>
          ))}
        </select>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            padding: "0 12px",
            transition: "all 0.2s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = theme.accent;
            e.currentTarget.style.boxShadow = `0 0 0 1px ${theme.accent}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = theme.border;
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <Search size={14} color={theme.textSecondary} />
          <input
            placeholder="Buscar ID de Correlação..."
            value={corrSearch}
            onChange={(e) => setCorrSearch(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              color: theme.textPrimary,
              fontSize: 13,
              outline: "none",
              fontFamily: "var(--font-jetbrains-mono)",
              width: 220,
              padding: "8px 0",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginLeft: "auto",
          }}
        >
          <Calendar size={14} color={theme.textSecondary} />
          <input
            type="date"
            defaultValue="2026-06-01"
            style={{ ...inputStyle, cursor: "pointer" }}
            onFocus={inputFocus}
            onBlur={inputBlur}
          />
          <span style={{ color: theme.textSecondary }}>-</span>
          <input
            type="date"
            defaultValue="2026-06-09"
            style={{ ...inputStyle, cursor: "pointer" }}
            onFocus={inputFocus}
            onBlur={inputBlur}
          />
        </div>
      </div>

      {/* Main Table */}
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
              minWidth: "800px",
            }}
          >
            <thead>
              <tr>
                {[
                  "Data/Hora",
                  "Usuário",
                  "Ação",
                  "Recurso",
                  "ID do Recurso",
                  "ID de Correlação",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "16px 24px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      color: theme.textSecondary,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      borderBottom: `1px solid ${theme.border}`,
                      background: "rgba(0,0,0,0.2)",
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
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: theme.textSecondary,
                    }}
                  >
                    Nenhum registro de auditoria encontrado correspondente aos
                    critérios.
                  </td>
                </tr>
              ) : (
                filtered.map((entry, i) => (
                  <motion.tr
                    variants={staggerItem}
                    whileHover={{ backgroundColor: theme.surfaceHover }}
                    key={i}
                    onClick={() => setDrawer(entry)}
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
                        color: theme.textSecondary,
                      }}
                    >
                      {entry.ts}
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        color: theme.textPrimary,
                        fontWeight: 500,
                      }}
                    >
                      {entry.user}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <ActionBadge action={entry.action} />
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        color: theme.textSecondary,
                      }}
                    >
                      {resourceLabels[entry.resource] || entry.resource}
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: 12,
                        color: theme.textPrimary,
                      }}
                    >
                      {entry.resourceId}
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: 12,
                        color: theme.textSecondary,
                      }}
                    >
                      {entry.corrId.length > 18
                        ? entry.corrId.slice(0, 18) + "…"
                        : entry.corrId}
                    </td>
                  </motion.tr>
                ))
              )}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>
      </div>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {drawer && <AuditDrawer entry={drawer} onClose={() => setDrawer(null)} />}
      </AnimatePresence>
    </Layout>
  );
}
