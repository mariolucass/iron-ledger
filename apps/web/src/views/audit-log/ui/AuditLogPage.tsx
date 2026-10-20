"use client";

import { colors as theme } from "@/shared/config/tokens";
import { Filter, Lock, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem, spring1 } from "@/shared/lib/animation";
import { AuditActionBadge as ActionBadge, auditActionLabels as actionLabels } from "@/entities/audit-log";
import { Layout } from "@/widgets/layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/kit/select";
import { DatePicker } from "@/shared/ui/kit/date-picker";

const resourceLabels: Record<string, string> = {
  Inventory: "Inventário",
  Transaction: "Transação",
  User: "Usuário",
  Permission: "Permissão",
  System: "Sistema",
};

import {
  type AuditEntry,
  actions,
  auditEntries as fallbackAuditEntries,
  beforeAfterData,
  resourceTypes,
} from "../model/auditData";
import { fetchAuditEntries } from "../model/load-audit-entries";

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
  const hasLiveDiff = entry.payload?.previousQuantity !== undefined && entry.payload?.resultingQuantity !== undefined;
  const before = hasLiveDiff ? { quantity: entry.payload?.previousQuantity } : beforeAfterData.before;
  const after = hasLiveDiff ? { quantity: entry.payload?.resultingQuantity } : beforeAfterData.after;

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
            { label: "Evento", value: entry.eventName ?? "Evento de demonstração" },
            { label: "Origem", value: entry.eventName ? "RabbitMQ" : "Dados de demonstração" },
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
          before={before}
          after={after}
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
            Este registro é append-only e foi persistido a partir de um evento
            de domínio consumido pelo módulo de auditoria.
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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [drawer, setDrawer] = useState<AuditEntry | null>(null);
  const [entries, setEntries] = useState<AuditEntry[]>(fallbackAuditEntries);
  const [dataSource, setDataSource] = useState<"loading" | "live" | "fallback">("loading");
  const [dataMessage, setDataMessage] = useState("");

  useEffect(() => {
    void fetchAuditEntries()
      .then((liveEntries) => { setEntries(liveEntries); setDataSource("live"); })
      .catch((error: unknown) => {
        setEntries(fallbackAuditEntries);
        setDataSource("fallback");
        setDataMessage(error instanceof Error ? error.message : "Exibindo dados de demonstração.");
      });
  }, []);

  const filtered = entries.filter((e) => {
    const occurredAt = new Date(e.occurredAt ?? `${e.ts.replace(" ", "T")}Z`);
    const matchesPeriod =
      (!dateFrom || occurredAt >= new Date(`${dateFrom}T00:00:00`)) &&
      (!dateTo || occurredAt <= new Date(`${dateTo}T23:59:59.999`));
    return (
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
      (corrSearch === "" || e.corrId.includes(corrSearch)) &&
      matchesPeriod
    );
  });


  return (
    <Layout title="Log de Auditoria">
      <style>{`
        @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {dataSource !== "live" && (
        <div className="mb-4 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-xs text-warning">
          {dataSource === "loading" ? "Conectando à API de auditoria…" : `Dados de demonstração · ${dataMessage}`}
        </div>
      )}

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
        <Select value={resourceType} onValueChange={setResourceType}>
          <SelectTrigger className="w-[160px]" aria-label="Filtrar por recurso">
            <Filter size={14} />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {resourceTypes.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-[180px]" aria-label="Filtrar por ação">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
          <DatePicker
            aria-label="Data inicial"
            placeholder="Data inicial"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={setDateFrom}
          />
          <span style={{ color: theme.textSecondary }}>-</span>
          <DatePicker
            aria-label="Data final"
            placeholder="Data final"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={setDateTo}
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
