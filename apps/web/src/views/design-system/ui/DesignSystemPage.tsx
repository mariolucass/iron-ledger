"use client";

import {
  AlertTriangle,
  Check,
  Copy,
  GitBranch,
  Lock,
  Minus,
  Plus,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Layout } from "@/widgets/layout";
import { StatusBadge } from "@/shared/ui/status-badge";
import {
  actionColors,
  colors as t,
  statusColors,
} from "@/shared/config/tokens";

// ─── Design Tokens (matches Layout + LoginPage) ───────────────────────────────

// ─── Color Palette ────────────────────────────────────────────────────────────
const palette = [
  { name: "Background", hex: "#080808", token: "--background", dark: false },
  {
    name: "Surface",
    hex: "rgba(255,255,255,0.03)",
    token: "--card",
    dark: false,
    display: "#111111",
  },
  {
    name: "Border",
    hex: "rgba(255,255,255,0.07)",
    token: "--border",
    dark: false,
    display: "#161616",
  },
  { name: "Accent", hex: "#00E5A0", token: "--primary", dark: true },
  { name: "Accent Dark", hex: "#00B37E", token: "--primary-hover", dark: true },
  { name: "Danger", hex: "#FF453A", token: "--destructive", dark: true },
  { name: "Warning", hex: "#FF9F0A", token: "--warning", dark: true },
  { name: "Text Primary", hex: "#F5F5F7", token: "--foreground", dark: true },
  {
    name: "Text Secondary",
    hex: "#86868B",
    token: "--muted-foreground",
    dark: true,
  },
];

// ─── Typography Scale ─────────────────────────────────────────────────────────
const typographyScale = [
  {
    name: "Display",
    size: "28px",
    weight: "800",
    lh: "1.08",
    family: "var(--font-manrope)",
    sample: "Controle financeiro, redefinido.",
  },
  {
    name: "H1",
    size: "22px",
    weight: "700",
    lh: "1.2",
    family: "var(--font-manrope)",
    sample: "Visão Geral do Dashboard",
  },
  {
    name: "H2 / Section",
    size: "16px",
    weight: "600",
    lh: "1.3",
    family: "var(--font-manrope)",
    sample: "Transações Recentes",
  },
  {
    name: "Body",
    size: "14px",
    weight: "400",
    lh: "1.6",
    family: "var(--font-manrope)",
    sample: "Detalhes da transação e entradas de auditoria aparecem aqui.",
  },
  {
    name: "Body Small",
    size: "13px",
    weight: "400",
    lh: "1.55",
    family: "var(--font-manrope)",
    sample: "Iniciado por ops@ironledger · 09/06/2026",
  },
  {
    name: "Caption / Label",
    size: "11px",
    weight: "600",
    lh: "1.4",
    family: "var(--font-manrope)",
    sample: "ID DA TRANSAÇÃO · SUPER ADMIN",
  },
  {
    name: "Mono / IDs",
    size: "13px",
    weight: "500",
    lh: "1.5",
    family: "JetBrains Mono",
    sample: "TXN-00483921",
  },
  {
    name: "Mono / Hash",
    size: "11px",
    weight: "400",
    lh: "1.5",
    family: "JetBrains Mono",
    sample: "corr-a9f2b1e3-7d4c-8b5a",
  },
];

// ─── Spacing Scale ────────────────────────────────────────────────────────────
const spacingScale = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64];

// ─── Border Radius Scale ──────────────────────────────────────────────────────
const radiusScale = [
  { name: "sm", value: "8px", demo: 8 },
  { name: "md", value: "10px", demo: 10 },
  { name: "lg", value: "12px", demo: 12 },
  { name: "xl", value: "16px", demo: 16 },
  { name: "pill", value: "999px", demo: 999 },
];

// ─── CopyBadge ────────────────────────────────────────────────────────────────
function CopyBadge({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 6px",
        borderRadius: 5,
        color: copied ? t.accent : t.textTertiary,
        fontSize: 10,
        fontFamily: "var(--font-jetbrains-mono)",
        transition: "all 0.15s",
      }}
      title="Copy token"
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {value}
    </button>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 64 }}>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: subtitle ? 6 : 0,
          }}
        >
          <div
            style={{
              width: 3,
              height: 18,
              borderRadius: 99,
              background: `linear-gradient(180deg, ${t.accent} 0%, ${t.accentDark} 100%)`,
              flexShrink: 0,
            }}
          />
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: t.textPrimary,
              margin: 0,
              letterSpacing: "-0.025em",
            }}
          >
            {title}
          </h2>
        </div>
        {subtitle && (
          <p
            style={{
              fontSize: 12.5,
              color: t.textSecondary,
              margin: "0 0 0 13px",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <div
        style={{
          height: 1,
          background: t.border,
          marginBottom: 24,
        }}
      />
      {children}
    </section>
  );
}

// ─── Card Shell ───────────────────────────────────────────────────────────────
function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function DesignSystemPage() {
  const diffRows = [
    { key: "status", before: '"PENDING"', after: '"PROCESSING"' },
    { key: "quantity", before: "42", after: "37" },
    { key: "reserved", before: "8", after: "13" },
    { key: "version", before: "11", after: "12" },
    {
      key: "updatedAt",
      before: '"2026-06-09T13:40:00Z"',
      after: '"2026-06-09T13:40:10Z"',
    },
  ];

  const kpiCards = [
    {
      label: "Total de SKUs",
      value: "4,821",
      change: "+12 hoje",
      icon: Plus,
      up: true,
    },
    {
      label: "Transações Ativas",
      value: "38",
      change: "6 PROCESSANDO",
      icon: Zap,
      up: true,
    },
    {
      label: "Alertas Pendentes",
      value: "14",
      change: "3 ALTO",
      icon: AlertTriangle,
      up: false,
    },
    {
      label: "Precisão da Previsão",
      value: "94.2%",
      change: "Últ. 30d",
      icon: TrendingUp,
      up: true,
    },
  ];

  return (
    <Layout title="Design System">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .ds-color-swatch {
          position: relative;
          cursor: pointer;
          overflow: hidden;
        }
        .ds-color-swatch::after {
          content: 'Copy';
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.45);
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.15s;
          font-family: var(--font-manrope);
        }
        .ds-color-swatch:hover::after { opacity: 1; }

        .ds-btn-primary {
          background: linear-gradient(135deg, ${t.accent} 0%, ${t.accentDark} 100%);
          color: #080808;
          border: none;
          border-radius: 10px;
          padding: 10px 20px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          font-family: var(--font-manrope);
          transition: opacity 0.18s, transform 0.18s;
          letter-spacing: -0.01em;
        }
        .ds-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }

        .ds-btn-secondary {
          background: ${t.surfaceElevated};
          color: ${t.textPrimary};
          border: 1px solid ${t.border};
          border-radius: 10px;
          padding: 10px 20px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font-manrope);
          transition: all 0.18s;
        }
        .ds-btn-secondary:hover { border-color: ${t.borderStrong}; background: ${t.surfaceHover}; }

        .ds-btn-ghost {
          background: transparent;
          color: ${t.textSecondary};
          border: 1px solid ${t.border};
          border-radius: 10px;
          padding: 10px 20px;
          font-size: 13.5px;
          cursor: pointer;
          font-family: var(--font-manrope);
          transition: all 0.18s;
        }
        .ds-btn-ghost:hover { color: ${t.textPrimary}; border-color: ${t.borderStrong}; }

        .ds-btn-danger {
          background: ${t.dangerSoft};
          color: ${t.danger};
          border: 1px solid rgba(255,69,58,0.25);
          border-radius: 10px;
          padding: 10px 20px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font-manrope);
          transition: all 0.18s;
        }
        .ds-btn-danger:hover { background: rgba(255,69,58,0.2); border-color: rgba(255,69,58,0.4); }

        .ds-btn-icon {
          background: ${t.surface};
          border: 1px solid ${t.border};
          border-radius: 10px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: ${t.textSecondary};
          transition: all 0.18s;
        }
        .ds-btn-icon:hover { border-color: ${t.borderStrong}; color: ${t.textPrimary}; }

        .ds-input {
          background: ${t.surface};
          border: 1px solid ${t.border};
          border-radius: 10px;
          padding: 10px 14px;
          color: ${t.textPrimary};
          font-size: 13.5px;
          font-family: var(--font-manrope);
          outline: none;
          width: 220px;
          transition: all 0.18s;
        }
        .ds-input::placeholder { color: ${t.textTertiary}; }
        .ds-input:focus {
          border-color: ${t.accent};
          background: ${t.accentGlow};
          box-shadow: 0 0 0 3px ${t.accentSoft};
        }
        .ds-input.error { border-color: ${t.danger}; background: ${t.dangerSoft}; color: ${t.danger}; }
        .ds-input.error::placeholder { color: ${t.danger}; opacity: 0.7; }

        .ds-kpi-card {
          background: ${t.surface};
          border: 1px solid ${t.border};
          border-radius: 12px;
          padding: 22px;
          transition: border-color 0.18s;
        }
        .ds-kpi-card:hover { border-color: ${t.borderStrong}; }

        .workflow-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 3px;
          transition: box-shadow 0.2s;
        }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 52 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: t.accentSoft,
            border: `1px solid rgba(0,229,160,0.2)`,
            borderRadius: 99,
            padding: "4px 12px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: t.accent,
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: t.accent,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Iron Ledger · Design System v1.0
          </span>
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: t.textPrimary,
            letterSpacing: "-0.04em",
            margin: "0 0 10px",
          }}
        >
          Fundação
        </h1>
        <p
          style={{
            fontSize: 14,
            color: t.textSecondary,
            margin: 0,
            lineHeight: 1.65,
            maxWidth: 500,
          }}
        >
          A linguagem visual do Iron Ledger — tokens, componentes e padrões de
          interação construídos para clareza e confiança em interfaces
          financeiras.
        </p>
      </div>

      {/* ── Color Palette ── */}
      <Section
        title="Color Palette"
        subtitle="Todas as cores são definidas como propriedades CSS personalizadas. Clique em qualquer amostra para copiar o valor hexadecimal."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
            gap: 12,
          }}
        >
          {palette.map((c) => (
            <div
              key={c.token}
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              <div
                className="ds-color-swatch"
                style={{
                  height: 72,
                  borderRadius: 10,
                  background: c.display ?? c.hex,
                  border: `1px solid ${t.borderStrong}`,
                  cursor: "pointer",
                }}
                onClick={() => navigator.clipboard.writeText(c.hex)}
              />
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: t.textPrimary,
                    marginBottom: 2,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {c.name}
                </div>
                <CopyBadge value={c.token} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Typography ── */}
      <Section
        title="Typography Scale"
        subtitle="Inter para todo o texto da interface. JetBrains Mono para IDs, hashes, código e carimbos de data/hora."
      >
        <Card>
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "160px 64px 56px 72px 1fr",
              gap: 16,
              padding: "10px 20px",
              borderBottom: `1px solid ${t.border}`,
              background: "rgba(0,0,0,0.2)",
            }}
          >
            {["Style", "Size", "Wt", "Family", "Preview"].map((h) => (
              <span
                key={h}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: t.textTertiary,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {h}
              </span>
            ))}
          </div>
          {typographyScale.map((row, i) => (
            <div
              key={row.name}
              style={{
                display: "grid",
                gridTemplateColumns: "160px 64px 56px 72px 1fr",
                gap: 16,
                padding: "14px 20px",
                borderBottom:
                  i < typographyScale.length - 1
                    ? `1px solid ${t.border}`
                    : "none",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 11.5,
                  color: t.textSecondary,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                }}
              >
                {row.name}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-jetbrains-mono)",
                  color: t.textTertiary,
                }}
              >
                {row.size}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-jetbrains-mono)",
                  color: t.textTertiary,
                }}
              >
                {row.weight}
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  color: t.textTertiary,
                  letterSpacing: "-0.01em",
                }}
              >
                {row.family}
              </span>
              <span
                style={{
                  fontSize: row.size,
                  fontWeight: Number(row.weight),
                  lineHeight: row.lh,
                  fontFamily:
                    row.family === "JetBrains Mono"
                      ? "var(--font-jetbrains-mono)"
                      : "var(--font-manrope)",
                  color: t.textPrimary,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.sample}
              </span>
            </div>
          ))}
        </Card>
      </Section>

      {/* ── Spacing + Radius ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginBottom: 64,
        }}
      >
        {/* Spacing */}
        <div>
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 3,
                  height: 18,
                  borderRadius: 99,
                  background: `linear-gradient(180deg, ${t.accent} 0%, ${t.accentDark} 100%)`,
                  flexShrink: 0,
                }}
              />
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: t.textPrimary,
                  margin: 0,
                  letterSpacing: "-0.025em",
                }}
              >
                Spacing
              </h2>
            </div>
          </div>
          <div style={{ height: 1, background: t.border, marginBottom: 20 }} />
          <Card style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {spacingScale.map((sp) => (
                <div
                  key={sp}
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "var(--font-jetbrains-mono)",
                      color: t.textTertiary,
                      width: 28,
                      flexShrink: 0,
                    }}
                  >
                    {sp}
                  </span>
                  <div
                    style={{
                      width: sp * 1.5,
                      height: 8,
                      borderRadius: 4,
                      background: `linear-gradient(90deg, ${t.accent} 0%, ${t.accentDark} 100%)`,
                      opacity: 0.7,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      color: t.textTertiary,
                      fontFamily: "var(--font-jetbrains-mono)",
                    }}
                  >
                    {sp}px
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Border Radius */}
        <div>
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 3,
                  height: 18,
                  borderRadius: 99,
                  background: `linear-gradient(180deg, ${t.accent} 0%, ${t.accentDark} 100%)`,
                  flexShrink: 0,
                }}
              />
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: t.textPrimary,
                  margin: 0,
                  letterSpacing: "-0.025em",
                }}
              >
                Border Radius
              </h2>
            </div>
          </div>
          <div style={{ height: 1, background: t.border, marginBottom: 20 }} />
          <Card style={{ padding: "20px" }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 20,
                alignItems: "flex-end",
              }}
            >
              {radiusScale.map((r) => (
                <div
                  key={r.name}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      background: t.surfaceElevated,
                      border: `1px solid ${t.borderStrong}`,
                      borderRadius: r.demo,
                    }}
                  />
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: t.textSecondary,
                      }}
                    >
                      {r.name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--font-jetbrains-mono)",
                        color: t.textTertiary,
                      }}
                    >
                      {r.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Buttons ── */}
      <Section
        title="Buttons"
        subtitle="Quatro variantes semânticas. Primário usa o gradiente de destaque; os outros seguem os padrões superfície/fantasma/perigo."
      >
        <Card style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                alignItems: "center",
              }}
            >
              <button className="ds-btn-primary">Primary</button>
              <span style={{ fontSize: 10, color: t.textTertiary }}>
                Nova Transação
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                alignItems: "center",
              }}
            >
              <button className="ds-btn-secondary">Secondary</button>
              <span style={{ fontSize: 10, color: t.textTertiary }}>
                Ver Detalhes
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                alignItems: "center",
              }}
            >
              <button className="ds-btn-ghost">Ghost</button>
              <span style={{ fontSize: 10, color: t.textTertiary }}>
                Cancelar
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                alignItems: "center",
              }}
            >
              <button className="ds-btn-danger">Danger</button>
              <span style={{ fontSize: 10, color: t.textTertiary }}>
                Excluir Entrada
              </span>
            </div>

            <div style={{ width: 1, height: 40, background: t.border }} />

            {/* Icon buttons */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <button className="ds-btn-icon">
                  <Plus size={15} />
                </button>
                <button className="ds-btn-icon">
                  <Minus size={15} />
                </button>
                <button className="ds-btn-icon">
                  <Copy size={15} />
                </button>
              </div>
              <span style={{ fontSize: 10, color: t.textTertiary }}>
                Botões com Ícone
              </span>
            </div>
          </div>
        </Card>
      </Section>

      {/* ── Input Fields ── */}
      <Section
        title="Input Fields"
        subtitle="Três estados: padrão, focado (anel de destaque) e erro. Todos os campos compartilham o mesmo token de raio de borda."
      >
        <Card style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            {[
              {
                label: "Default",
                placeholder: "Search by SKU...",
                className: "",
              },
              {
                label: "Focus",
                defaultValue: "TXN-00483921",
                className: "focus-demo",
                autoFocus: true,
              },
              { label: "Error", defaultValue: "invalid@", className: "error" },
            ].map((field) => (
              <div
                key={field.label}
                style={{ display: "flex", flexDirection: "column", gap: 6 }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color:
                      field.className === "error"
                        ? t.danger
                        : field.className === "focus-demo"
                          ? t.accent
                          : t.textSecondary,
                    letterSpacing: "0.02em",
                  }}
                >
                  {field.label}
                </span>
                <input
                  className={`ds-input${field.className === "error" ? " error" : ""}`}
                  placeholder={field.placeholder}
                  defaultValue={field.defaultValue}
                  style={
                    field.className === "focus-demo"
                      ? {
                          borderColor: t.accent,
                          background: t.accentGlow,
                          boxShadow: `0 0 0 3px ${t.accentSoft}`,
                        }
                      : {}
                  }
                />
              </div>
            ))}
          </div>
        </Card>
      </Section>

      {/* ── Status + Action Badges ── */}
      <Section
        title="Status & Action Badges"
        subtitle="Usado em transações, logs de auditoria e linhas do tempo de fluxo de trabalho."
      >
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          {/* Status badges */}
          <Card style={{ padding: 20 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: t.textTertiary,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Status da Transação
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {Object.keys(statusColors).map((s) => (
                <div
                  key={s}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <StatusBadge status={s} pulse={s === "PROCESSING"} />
                  <span
                    style={{
                      fontSize: 9,
                      color: t.textTertiary,
                      fontFamily: "var(--font-jetbrains-mono)",
                    }}
                  >
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Action badges */}
          <Card style={{ padding: 20 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: t.textTertiary,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Ações do Log de Auditoria
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {Object.keys(actionColors).map((a) => (
                <div
                  key={a}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <StatusBadge status={a} type="action" />
                  <span
                    style={{
                      fontSize: 9,
                      color: t.textTertiary,
                      fontFamily: "var(--font-jetbrains-mono)",
                    }}
                  >
                    {a}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      {/* ── KPI Cards ── */}
      <Section
        title="KPI Cards"
        subtitle="Cartões de métricas usados no Dashboard. Ícone + valor + indicador de mudança contextual."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          {kpiCards.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="ds-kpi-card">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: t.textSecondary,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {k.label}
                  </span>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: k.up ? t.accentSoft : t.dangerSoft,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={14} color={k.up ? t.accent : t.danger} />
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: t.textPrimary,
                    letterSpacing: "-0.03em",
                    marginBottom: 6,
                  }}
                >
                  {k.value}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 500,
                    color: k.up ? t.accent : t.danger,
                  }}
                >
                  {k.change}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Diff Viewer ── */}
      <Section
        title="Visualizador de Diferenças"
        subtitle="Visualização lado a lado de antes/depois usada no Log de Auditoria para mostrar alterações em nível de campo."
      >
        <Card style={{ overflow: "hidden", maxWidth: 720 }}>
          {/* Header bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              borderBottom: `1px solid ${t.border}`,
            }}
          >
            <div
              style={{
                padding: "10px 20px",
                fontSize: 11,
                fontWeight: 700,
                color: t.danger,
                letterSpacing: "0.06em",
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(0,0,0,0.2)",
                borderRight: `1px solid ${t.border}`,
              }}
            >
              <Minus size={11} /> ANTES
            </div>
            <div
              style={{
                padding: "10px 20px",
                fontSize: 11,
                fontWeight: 700,
                color: t.accent,
                letterSpacing: "0.06em",
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(0,0,0,0.2)",
              }}
            >
              <Plus size={11} /> DEPOIS
            </div>
          </div>

          {diffRows.map((row, i) => (
            <div
              key={row.key}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                borderBottom:
                  i < diffRows.length - 1 ? `1px solid ${t.border}` : "none",
              }}
            >
              {/* Before */}
              <div
                style={{
                  padding: "9px 20px",
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: 12,
                  background: "rgba(255,69,58,0.04)",
                  borderRight: `1px solid ${t.border}`,
                  display: "flex",
                  gap: 8,
                }}
              >
                <span style={{ color: t.textTertiary }}>{row.key}:</span>
                <span style={{ color: t.danger }}>{row.before}</span>
              </div>
              {/* After */}
              <div
                style={{
                  padding: "9px 20px",
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: 12,
                  background: "rgba(0,229,160,0.04)",
                  display: "flex",
                  gap: 8,
                }}
              >
                <span style={{ color: t.textTertiary }}>{row.key}:</span>
                <span style={{ color: t.accent }}>{row.after}</span>
              </div>
            </div>
          ))}
        </Card>
      </Section>

      {/* ── Workflow Stepper ── */}
      <Section
        title="Fluxo de Trabalho"
        subtitle="Linha do tempo de transações. Cada etapa mostra seu nome, status e um carimbo de data/hora opcional."
      >
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <Card style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 20,
                fontSize: 13,
                fontWeight: 600,
                color: t.textPrimary,
              }}
            >
              <GitBranch size={15} color={t.accent} />
              Linha do Tempo do Fluxo de Trabalho
            </div>
            {[
              {
                name: "ValidateInventory",
                status: "COMPLETED",
                ts: "13:55:22",
              },
              { name: "ReserveStock", status: "COMPLETED", ts: "13:55:28" },
              { name: "CreateShipmentOrder", status: "IN_PROGRESS", ts: null },
              { name: "DeductInventory", status: "PENDING", ts: null },
            ].map((step, i, arr) => {
              const color =
                step.status === "COMPLETED"
                  ? t.accent
                  : step.status === "IN_PROGRESS"
                    ? "#5E5CE6"
                    : t.textTertiary;
              const isPending = step.status === "PENDING";
              return (
                <div
                  key={step.name}
                  style={{ display: "flex", gap: 16, position: "relative" }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      className="workflow-dot"
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: isPending ? t.bg : color,
                        border: `2px solid ${isPending ? t.border : color}`,
                        boxShadow: !isPending ? `0 0 8px ${color}55` : "none",
                        marginTop: 3,
                      }}
                    />
                    {i < arr.length - 1 && (
                      <div
                        style={{
                          width: 2,
                          flex: 1,
                          minHeight: 20,
                          background: t.border,
                          margin: "4px 0",
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      paddingBottom: i < arr.length - 1 ? 14 : 0,
                      opacity: isPending ? 0.5 : 1,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: t.textPrimary,
                        marginBottom: 3,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {step.name}
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color,
                          fontWeight: 600,
                          letterSpacing: "0.04em",
                        }}
                      >
                        {step.status}
                      </span>
                      {step.ts && (
                        <span
                          style={{
                            fontSize: 11,
                            color: t.textTertiary,
                            fontFamily: "var(--font-jetbrains-mono)",
                          }}
                        >
                          · {step.ts}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Alert card variant */}
          <Card style={{ padding: 24 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: t.textPrimary,
                marginBottom: 16,
              }}
            >
              Cartão de Alerta
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                {
                  severity: "HIGH",
                  color: t.danger,
                  bg: t.dangerSoft,
                  product: "Tênis Esportivo Nike Air",
                  msg: "Ruptura em 4 dias",
                },
                {
                  severity: "MEDIUM",
                  color: t.warning,
                  bg: t.warningSoft,
                  product: "Camiseta de Algodão Premium",
                  msg: "Abaixo do mín. em 11 dias",
                },
                {
                  severity: "LOW",
                  color: t.textSecondary,
                  bg: t.surfaceElevated,
                  product: "Calça Jeans Slim Fit",
                  msg: "Reserva marginal",
                },
              ].map((a) => (
                <div
                  key={a.severity}
                  style={{
                    background: "rgba(0,0,0,0.2)",
                    border: `1px solid ${t.border}`,
                    borderLeft: `3px solid ${a.color}`,
                    borderRadius: 8,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: t.textPrimary,
                        marginBottom: 2,
                      }}
                    >
                      {a.product}
                    </div>
                    <div style={{ fontSize: 11.5, color: t.textSecondary }}>
                      {a.msg}
                    </div>
                  </div>
                  <span
                    style={{
                      background: a.bg,
                      color: a.color,
                      borderRadius: 99,
                      padding: "2px 9px",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      flexShrink: 0,
                    }}
                  >
                    {a.severity}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      {/* ── Immutability Pattern ── */}
      <Section
        title="Padrão de Imutabilidade de Auditoria"
        subtitle="Um ícone de cadeado sem controles de edição/exclusão sinaliza registros de gravação única e à prova de violações."
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {/* Standard */}
          <Card
            style={{
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              maxWidth: 440,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: t.surfaceElevated,
                border: `1px solid ${t.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Lock size={16} color={t.textSecondary} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: t.textPrimary,
                  marginBottom: 3,
                }}
              >
                Registro Imutável
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: t.textSecondary,
                  lineHeight: 1.5,
                }}
              >
                Entradas de auditoria são de gravação única. Nenhum controle de
                edição ou exclusão é renderizado.
              </div>
            </div>
          </Card>

          {/* Hash pill */}
          <Card
            style={{
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              maxWidth: 320,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: t.textTertiary,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Hash de Integridade
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: t.accentSoft,
                border: `1px solid rgba(0,229,160,0.2)`,
                borderRadius: 8,
                padding: "8px 12px",
              }}
            >
              <Lock size={12} color={t.accent} />
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: 11,
                  color: t.accent,
                  letterSpacing: "0.02em",
                }}
              >
                sha256:a9f2b1e3-7d4c-8b5a
              </span>
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: t.textSecondary,
                lineHeight: 1.5,
              }}
            >
              Cada registro de auditoria tem seu hash gerado e é encadeado à
              entrada anterior.
            </div>
          </Card>
        </div>
      </Section>
    </Layout>
  );
}
