"use client";

import { colors as theme } from "@/shared/config/tokens";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Package,
  Plus,
  QrCode,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { Layout } from "@/widgets/layout/Layout";
import { StatusBadge } from "@/shared/ui/status-badge";
import {
  fadeInUp,
  fastStagger,
  scaleIn,
  slideInLeft,
  spring4,
  staggerContainer,
  staggerItem,
} from "@/shared/lib/animation";
import {
  KPI,
  kpis,
  dashboardRecentTransactions as recentTransactions,
  DashboardStockAlert as StockAlert,
  dashboardStockAlerts as stockAlerts,
} from "../model/dashboardData";

// ─── Design Tokens (synchronized with Layout "Cryptix" theme) ────────────────

const severityConfig: Record<
  string,
  { color: string; soft: string; label: string }
> = {
  CRITICAL: { color: "#FF1A1A", soft: "rgba(255, 26, 26, 0.12)", label: "CRÍTICA" },
  HIGH: { color: theme.danger, soft: theme.dangerSoft, label: "ALTA" },
  MEDIUM: { color: theme.warning, soft: theme.warningSoft, label: "MÉDIA" },
  LOW: { color: theme.textSecondary, soft: theme.surface, label: "BAIXA" },
};

// ─── Utility: time-aware greeting ────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function formatDate(): string {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Animated Count-Up Hook ──────────────────────────────────────────────────
function useCountUp(target: number, duration = 1400): number {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const startVal = count;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target]);

  return count;
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
const quickActions = [
  {
    id: "new-transaction",
    icon: Plus,
    label: "Nova Transação",
    color: theme.accent,
    soft: theme.accentSoft,
    path: "/transactions",
  },
  {
    id: "add-product",
    icon: Package,
    label: "Add Produto",
    color: theme.blue,
    soft: theme.blueSoft,
    path: "/inventory",
  },
  {
    id: "report",
    icon: BarChart3,
    label: "Gerar Relatório",
    color: theme.purple,
    soft: theme.purpleSoft,
    path: "/audit-log",
  },
  {
    id: "scan-qr",
    icon: QrCode,
    label: "Escanear QR",
    color: theme.warning,
    soft: theme.warningSoft,
    path: "/inventory",
  },
  {
    id: "forecasting",
    icon: TrendingUp,
    label: "Previsões",
    color: "#34D399",
    soft: "rgba(52,211,153,0.12)",
    path: "/forecasting",
  },
  {
    id: "alerts",
    icon: Zap,
    label: "Alertas",
    color: "#F87171",
    soft: "rgba(248,113,113,0.12)",
    path: "/alerts",
  },
] as const;

// ─── Sparkline Tooltip ────────────────────────────────────────────────────────
function SparkTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(20,20,20,0.95)",
        border: `1px solid ${theme.borderStrong}`,
        borderRadius: 6,
        padding: "4px 8px",
        fontSize: 11,
        color: theme.textPrimary,
        fontFamily: "var(--font-manrope)",
        fontWeight: 600,
      }}
    >
      {payload[0].value.toLocaleString("pt-BR")}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ kpi, index }: { kpi: KPI; index: number }) {
  const Icon = kpi.icon;
  const [hovered, setHovered] = useState(false);
  const countDisplay = useCountUp(kpi.numericValue, 1200 + index * 100);

  const sparkData = kpi.sparkline.map((v, i) => ({ d: i, v }));

  const displayValue = kpi.value.includes("%")
    ? `${(countDisplay / 10).toFixed(1)}%`
    : countDisplay.toLocaleString("pt-BR");

  return (
    <motion.div
      variants={staggerItem}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={spring4}
      style={{
        background: hovered ? theme.surfaceElevated : theme.surface,
        borderColor: hovered ? theme.borderStrong : theme.border,
        borderStyle: "solid",
        borderWidth: 1,
        borderLeftColor: kpi.accentColor,
        borderLeftWidth: 3,
        borderRadius: 16,
        padding: "20px 22px",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
        transition: "background 0.2s ease, border-color 0.2s ease",
        boxShadow: hovered
          ? `0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px ${kpi.accentColor}18`
          : "0 4px 16px rgba(0,0,0,0.2)",
      }}
    >
      {/* Ambient glow in corner */}
      <div
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 100,
          height: 100,
          background: kpi.accentColor,
          filter: "blur(40px)",
          opacity: hovered ? 0.12 : 0.06,
          pointerEvents: "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Top row: label + icon */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: theme.textSecondary,
            fontWeight: 500,
            letterSpacing: "0.02em",
            lineHeight: 1.4,
            maxWidth: "65%",
          }}
        >
          {kpi.label}
        </span>
        <motion.div
          animate={{
            background: hovered ? `${kpi.accentColor}1A` : theme.surfaceHover,
            borderColor: hovered ? `${kpi.accentColor}40` : "transparent",
          }}
          transition={{ duration: 0.2 }}
          style={{
            padding: "7px",
            borderRadius: 10,
            border: "1px solid transparent",
          }}
        >
          <Icon
            size={15}
            color={hovered ? kpi.accentColor : theme.textSecondary}
            style={{ transition: "color 0.2s ease" }}
          />
        </motion.div>
      </div>

      {/* Value + pulse dot */}
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: theme.textPrimary,
          letterSpacing: "-0.04em",
          marginBottom: 4,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {displayValue}
        {kpi.hasProcessing && (
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: kpi.accentColor,
              animation: "pulse-kpi 1.8s ease-in-out infinite",
              display: "inline-block",
              boxShadow: `0 0 10px ${kpi.accentColor}`,
              flexShrink: 0,
            }}
          />
        )}
      </div>

      {/* Change line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 14,
          fontSize: 12,
          fontWeight: 500,
          color: kpi.changeUp ? kpi.accentColor : theme.danger,
        }}
      >
        {kpi.changeUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {kpi.change}
      </div>

      {/* Sparkline chart */}
      <div style={{ height: 36, marginLeft: -6, marginRight: -6 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData}>
            <defs>
              <linearGradient
                id={`spark-${kpi.label}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={kpi.accentColor}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={kpi.accentColor}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <Tooltip content={<SparkTooltip />} />
            <Area
              type="monotone"
              dataKey="v"
              stroke={kpi.accentColor}
              strokeWidth={1.5}
              fill={`url(#spark-${kpi.label})`}
              dot={false}
              activeDot={{ r: 3, fill: kpi.accentColor, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// ─── Quick Action Pill ────────────────────────────────────────────────────────
function QuickActionPill({
  action,
}: {
  action: (typeof quickActions)[number];
}) {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);
  const Icon = action.icon;

  return (
    <motion.button
      variants={scaleIn}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={spring4}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={() => router.push(action.path)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 16px",
        background: pressed ? action.soft : theme.surface,
        border: `1px solid ${pressed ? action.color + "40" : theme.border}`,
        borderRadius: 999,
        cursor: "pointer",
        whiteSpace: "nowrap",
        flexShrink: 0,
        transition: "background 0.15s ease, border-color 0.15s ease",
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: action.soft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={12} color={action.color} />
      </div>
      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: theme.textSecondary,
          letterSpacing: "-0.01em",
          fontFamily: "var(--font-manrope)",
        }}
      >
        {action.label}
      </span>
    </motion.button>
  );
}

// ─── Timeline Entry ───────────────────────────────────────────────────────────
function TimelineEntry({
  tx,
  isLast,
}: {
  tx: (typeof recentTransactions)[number];
  isLast: boolean;
}) {
  const router = useRouter();

  const typeColor: Record<string, string> = {
    SAÍDA: theme.danger,
    ENTRADA: theme.accent,
    AJUSTE: theme.warning,
  };

  return (
    <motion.div
      variants={slideInLeft}
      style={{ display: "flex", gap: 14, position: "relative" }}
    >
      {/* Timeline connector */}
      {!isLast && (
        <div
          style={{
            position: "absolute",
            left: 16,
            top: 36,
            bottom: -12,
            width: 1,
            background: `linear-gradient(to bottom, ${theme.border}, transparent)`,
          }}
        />
      )}

      {/* Avatar dot */}
      <div style={{ flexShrink: 0, zIndex: 1 }}>
        <div
          style={{
            width: 33,
            height: 33,
            borderRadius: "50%",
            background: `${tx.avatarColor}1A`,
            border: `1.5px solid ${tx.avatarColor}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            color: tx.avatarColor,
            letterSpacing: "0.02em",
            fontFamily: "var(--font-manrope)",
          }}
        >
          {tx.avatarInitials}
        </div>
      </div>

      {/* Content */}
      <motion.div
        whileHover={{ x: 2 }}
        transition={spring4}
        onClick={() => router.push(`/transactions/${tx.id}`)}
        style={{
          flex: 1,
          paddingBottom: isLast ? 0 : 20,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 5,
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: 12.5,
                fontWeight: 600,
                color: theme.textPrimary,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
              }}
            >
              {tx.id}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: typeColor[tx.type] ?? theme.textSecondary,
                background: `${typeColor[tx.type] ?? theme.textSecondary}15`,
                border: `1px solid ${typeColor[tx.type] ?? theme.textSecondary}30`,
                borderRadius: 999,
                padding: "1px 7px",
                letterSpacing: "0.05em",
                flexShrink: 0,
              }}
            >
              {tx.type}
            </span>
          </div>
          <span
            style={{
              fontSize: 11,
              color: theme.textTertiary,
              whiteSpace: "nowrap",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {tx.relativeTime}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: theme.textSecondary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {tx.initiatedBy}
          </span>
          <StatusBadge status={tx.status} pulse={tx.status === "PROCESSING"} />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Animated Progress Bar ────────────────────────────────────────────────────
function AnimatedProgressBar({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div
      style={{
        height: 4,
        background: theme.surface,
        borderRadius: 999,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${width}%`,
          background: `linear-gradient(90deg, ${color}80, ${color})`,
          borderRadius: 999,
          boxShadow: `0 0 8px ${color}60`,
          transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
}

// ─── Alert Card ───────────────────────────────────────────────────────────────
function AlertCard({ alert }: { alert: StockAlert }) {
  const cfg = severityConfig[alert.severity];
  const fillPct = Math.min((alert.current / alert.min) * 100, 100);
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      variants={staggerItem}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ scale: 1.01 }}
      transition={spring4}
      style={{
        background: hovered ? `${cfg.color}08` : "transparent",
        borderColor: hovered ? `${cfg.color}30` : theme.border,
        borderStyle: "solid",
        borderWidth: 1,
        borderLeftColor: cfg.color,
        borderLeftWidth: 3,
        borderRadius: 12,
        padding: "14px 16px",
        transition: "background 0.2s ease, border-color 0.2s ease",
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 8,
          gap: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: theme.textPrimary,
              letterSpacing: "-0.01em",
              marginBottom: 3,
            }}
          >
            {alert.product}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: theme.textSecondary,
            }}
          >
            <Package size={11} opacity={0.7} />
            {alert.warehouse}
            <span style={{ color: theme.textTertiary }}>·</span>
            <span
              style={{
                fontSize: 10,
                color: theme.textTertiary,
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 4,
                padding: "1px 5px",
              }}
            >
              {alert.category}
            </span>
          </div>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: cfg.color,
            background: cfg.soft,
            border: `1px solid ${cfg.color}35`,
            borderRadius: 999,
            padding: "3px 9px",
            letterSpacing: "0.04em",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <AlertTriangle size={9} />
          {cfg.label}
        </span>
      </div>

      {/* Progress bar + count */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <AnimatedProgressBar value={fillPct} color={cfg.color} />
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: cfg.color,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
            fontFamily: "var(--font-jetbrains-mono)",
          }}
        >
          {alert.current} / {alert.min}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({
  title,
  badge,
  action,
  onAction,
}: {
  title: string;
  badge?: React.ReactNode;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div
      style={{
        padding: "16px 20px",
        borderBottom: `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(0,0,0,0.15)",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: theme.textPrimary,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </span>
        {badge}
      </div>
      {action && (
        <motion.button
          whileHover={{
            borderColor: theme.accent,
            color: theme.accent,
            backgroundColor: theme.accentSoft,
          }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
          onClick={onAction}
          style={{
            background: "transparent",
            border: `1px solid ${theme.border}`,
            borderRadius: 7,
            padding: "5px 12px",
            color: theme.textSecondary,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontFamily: "var(--font-manrope)",
          }}
        >
          {action}
          <ArrowRight size={11} />
        </motion.button>
      )}
    </div>
  );
}

// ─── Skeleton shimmer ─────────────────────────────────────────────────────────
function Skeleton({
  width = "100%",
  height = 16,
  radius = 6,
}: {
  width?: string | number;
  height?: number;
  radius?: number;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: "rgba(255,255,255,0.05)",
        animation: "shimmer 1.8s ease-in-out infinite",
        flexShrink: 0,
      }}
    />
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────
export function DashboardPage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const greeting = getGreeting();

  // Simulate async data load for skeleton demo
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 700);
    return () => clearTimeout(t);
  }, []);

  const totalAlerts = stockAlerts.length;
  const highAlerts = stockAlerts.filter((a) => a.severity === "HIGH").length;

  return (
    <Layout title="Dashboard">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        @keyframes pulse-kpi {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 10px ${theme.accent}; }
          50% { opacity: 0.5; transform: scale(0.78); box-shadow: 0 0 3px ${theme.accent}; }
        }

        @keyframes shimmer {
          0% { opacity: 0.4; }
          50% { opacity: 0.7; }
          100% { opacity: 0.4; }
        }

        @keyframes mesh-drift {
          0%   { transform: translate(0, 0) rotate(0deg); }
          33%  { transform: translate(30px, -20px) rotate(2deg); }
          66%  { transform: translate(-20px, 30px) rotate(-1deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>

      {/* ── Ambient Mesh Background ── */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "15%",
            width: 600,
            height: 600,
            background: `radial-gradient(ellipse, ${theme.accent}18 0%, transparent 70%)`,
            animation: "mesh-drift 18s ease-in-out infinite",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "5%",
            right: "10%",
            width: 400,
            height: 400,
            background: `radial-gradient(ellipse, ${theme.purple}12 0%, transparent 70%)`,
            animation: "mesh-drift 24s ease-in-out infinite reverse",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "40%",
            right: "30%",
            width: 300,
            height: 300,
            background: `radial-gradient(ellipse, ${theme.blue}0E 0%, transparent 70%)`,
            animation: "mesh-drift 30s ease-in-out infinite 6s",
            filter: "blur(50px)",
          }}
        />
      </div>

      {/* ── Content (relative to sit above bg) ── */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* ── Greeting Hero ── */}
        <AnimatePresence>
          {loaded && (
            <motion.div
              key="hero"
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              style={{ marginBottom: 32 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: theme.accent,
                        boxShadow: `0 0 12px ${theme.accent}`,
                        animation: "pulse-kpi 2.2s ease-in-out infinite",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: theme.accent,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      Sistema Operacional
                    </span>
                  </div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 30,
                      fontWeight: 700,
                      color: theme.textPrimary,
                      letterSpacing: "-0.04em",
                      lineHeight: 1.1,
                      fontFamily: "var(--font-manrope)",
                    }}
                  >
                    {greeting}, Admin 👋
                  </h2>
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: 13.5,
                      color: theme.textSecondary,
                      fontFamily: "var(--font-manrope)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {formatDate()}
                    <span
                      style={{ color: theme.textTertiary, margin: "0 8px" }}
                    >
                      ·
                    </span>
                    <span style={{ color: theme.textSecondary }}>
                      38 transações ativas
                    </span>
                    <span
                      style={{ color: theme.textTertiary, margin: "0 8px" }}
                    >
                      ·
                    </span>
                    <span style={{ color: theme.danger }}>
                      {highAlerts} alertas críticos
                    </span>
                  </p>
                </div>

                {/* Live indicator */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 999,
                  }}
                >
                  <Activity size={14} color={theme.accent} />
                  <span
                    style={{
                      fontSize: 12,
                      color: theme.textSecondary,
                      fontWeight: 500,
                      fontFamily: "var(--font-manrope)",
                    }}
                  >
                    Ao vivo
                  </span>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: theme.accent,
                      animation: "pulse-kpi 2s ease-in-out infinite",
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── KPI Cards ── */}
        <AnimatePresence mode="wait">
          {!loaded ? (
            <motion.div
              key="kpi-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 16,
                    padding: "20px 22px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Skeleton width="55%" height={12} />
                    <Skeleton width={28} height={28} radius={8} />
                  </div>
                  <Skeleton width="40%" height={28} radius={6} />
                  <Skeleton width="60%" height={10} radius={4} />
                  <Skeleton width="100%" height={36} radius={4} />
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="kpi-grid"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {kpis.map((kpi, i) => (
                <KpiCard key={kpi.label} kpi={kpi} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Quick Actions ── */}
        <AnimatePresence>
          {loaded && (
            <motion.div
              key="actions"
              variants={fastStagger}
              initial="hidden"
              animate="show"
              style={{ marginBottom: 28 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Zap size={13} color={theme.textTertiary} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: theme.textTertiary,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-manrope)",
                  }}
                >
                  Ações Rápidas
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {quickActions.map((action) => (
                  <QuickActionPill key={action.id} action={action} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Two-Column: Timeline + Alerts ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
            gap: 20,
          }}
        >
          {/* ── Activity Timeline Panel ── */}
          <motion.div
            variants={staggerItem}
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 16,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SectionHeader
              title="Atividade Recente"
              action="Ver tudo"
              onAction={() => router.push("/transactions")}
            />

            <div style={{ padding: "20px 20px 16px" }}>
              {!loaded ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 20 }}
                >
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ display: "flex", gap: 12 }}>
                      <Skeleton width={33} height={33} radius={999} />
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        <Skeleton width="70%" height={12} />
                        <Skeleton width="50%" height={10} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={fastStagger}
                  initial="hidden"
                  animate="show"
                >
                  {recentTransactions.map((tx, i) => (
                    <TimelineEntry
                      key={tx.id}
                      tx={tx}
                      isLast={i === recentTransactions.length - 1}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* ── Stock Alerts Panel ── */}
          <motion.div
            variants={staggerItem}
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 16,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SectionHeader
              title="Alertas de Estoque"
              badge={
                <span
                  style={{
                    background: theme.dangerSoft,
                    border: `1px solid ${theme.danger}35`,
                    color: theme.danger,
                    borderRadius: 999,
                    padding: "2px 10px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <AlertTriangle size={10} />
                  {totalAlerts} alertas
                </span>
              }
              action="Gerenciar"
              onAction={() => router.push("/alerts")}
            />

            <div
              style={{
                padding: "16px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {!loaded ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        border: `1px solid ${theme.border}`,
                        borderRadius: 12,
                        padding: 14,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 5,
                          }}
                        >
                          <Skeleton width={160} height={13} />
                          <Skeleton width={100} height={10} />
                        </div>
                        <Skeleton width={50} height={22} radius={999} />
                      </div>
                      <Skeleton width="100%" height={4} radius={999} />
                    </div>
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {stockAlerts.map((alert) => (
                    <AlertCard key={alert.product} alert={alert} />
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}
