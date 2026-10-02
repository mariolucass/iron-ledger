"use client";

import { colors as theme } from "@/shared/config/tokens";
import {
  BarChart2,
  Calendar,
  Download,
  FileIcon,
  FileSpreadsheet,
  FileText,
  Filter,
  RefreshCw,
  Search,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Layout } from "@/widgets/layout/Layout";

// 1. Tema "Cryptix" Integrado

import {
  activityData,
  formats,
  recentReports,
  reportTypes,
} from "../model/reportsData";

// Componente Tooltip Customizado para o Gráfico
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div
      style={{
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: 8,
        padding: "12px 16px",
        fontSize: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          color: theme.textSecondary,
          marginBottom: 8,
          fontFamily: "var(--font-jetbrains-mono)",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      {payload.map((p: any, i: number) => (
        <div
          key={i}
          style={{
            color: p.color,
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 4,
          }}
        >
          <span
            style={{ color: theme.textSecondary, textTransform: "capitalize" }}
          >
            {p.name}:
          </span>
          <strong style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
            {p.value}
          </strong>
        </div>
      ))}
    </div>
  );
};

// 3. Componente Principal
export function ReportsPage() {
  const [reportType, setReportType] = useState(reportTypes[0]);
  const [format, setFormat] = useState(formats[0]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000); // Simula o tempo de geração
  };

  const inputStyle = {
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: "10px 14px",
    color: theme.textPrimary,
    fontSize: 13,
    outline: "none",
    transition: "all 0.2s",
  };

  const getFormatIcon = (fmt: string) => {
    if (fmt.includes("CSV")) return <FileText size={16} color={theme.info} />;
    if (fmt.includes("XLSX"))
      return <FileSpreadsheet size={16} color={theme.accent} />;
    return <FileIcon size={16} color={theme.danger} />; // PDF
  };

  return (
    <Layout title="Relatórios e Extração de Dados">
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        ::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; opacity: 0.6; transition: 0.2s; }
        ::-webkit-calendar-picker-indicator:hover { opacity: 1; }
      `}</style>

      {/* Control Panel (Gerador de Relatórios) */}
      <div
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: 32,
          marginBottom: 24,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: theme.accentGlow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${theme.accent}40`,
            }}
          >
            <Download size={20} color={theme.accent} />
          </div>
          <div>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: theme.textPrimary,
                margin: "0 0 4px",
              }}
            >
              Gerar Novo Relatório
            </h2>
            <div style={{ fontSize: 13, color: theme.textSecondary }}>
              Extraia dados dos logs imutáveis do Kafka ou da base de dados
              transacional.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          {/* Tipo de Relatório */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: theme.textSecondary,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Domínio
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                ...inputStyle,
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = theme.accent)
              }
              onBlur={(e) => (e.currentTarget.style.borderColor = theme.border)}
            >
              <Filter size={14} color={theme.textSecondary} />
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: theme.textPrimary,
                  width: "100%",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {reportTypes.map((r) => (
                  <option key={r} value={r} style={{ background: theme.bg }}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Período */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: theme.textSecondary,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Período de Extração
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                ...inputStyle,
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = theme.accent)
              }
              onBlur={(e) => (e.currentTarget.style.borderColor = theme.border)}
            >
              <Calendar size={14} color={theme.textSecondary} />
              <input
                type="date"
                defaultValue="2026-06-01"
                style={{
                  background: "transparent",
                  border: "none",
                  color: theme.textPrimary,
                  width: "100%",
                  outline: "none",
                  cursor: "pointer",
                }}
              />
              <span style={{ color: theme.textSecondary }}>até</span>
              <input
                type="date"
                defaultValue="2026-06-09"
                style={{
                  background: "transparent",
                  border: "none",
                  color: theme.textPrimary,
                  width: "100%",
                  outline: "none",
                  cursor: "pointer",
                }}
              />
            </div>
          </div>

          {/* Formato */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: theme.textSecondary,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Formato
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                ...inputStyle,
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = theme.accent)
              }
              onBlur={(e) => (e.currentTarget.style.borderColor = theme.border)}
            >
              {getFormatIcon(format)}
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: theme.textPrimary,
                  width: "100%",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {formats.map((f) => (
                  <option key={f} value={f} style={{ background: theme.bg }}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}
        >
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: isGenerating ? theme.surfaceHover : theme.accent,
              color: isGenerating ? theme.textSecondary : "#000",
              border: `1px solid ${isGenerating ? theme.border : "transparent"}`,
              borderRadius: 8,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 700,
              cursor: isGenerating ? "not-allowed" : "pointer",
              boxShadow: isGenerating ? "none" : `0 0 16px ${theme.accentGlow}`,
              transition: "all 0.2s",
            }}
          >
            {isGenerating ? (
              <>
                <RefreshCw
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />{" "}
                Processando Dados...
              </>
            ) : (
              <>
                <Download size={16} /> Iniciar Extração
              </>
            )}
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
          gap: 24,
        }}
      >
        {/* Gráfico de Visão Geral */}
        <div
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            padding: 32,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 24,
            }}
          >
            <BarChart2 size={18} color={theme.accent} />
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: theme.textPrimary,
              }}
            >
              Volume de Operações (Junho)
            </span>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={activityData}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme.border}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 11,
                  fill: theme.textSecondary,
                  fontFamily: "var(--font-jetbrains-mono)",
                }}
                axisLine={{ stroke: theme.border }}
                tickLine={false}
                dy={10}
              />
              <YAxis
                tick={{
                  fontSize: 11,
                  fill: theme.textSecondary,
                  fontFamily: "var(--font-jetbrains-mono)",
                }}
                axisLine={false}
                tickLine={false}
                dx={-10}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: theme.surfaceHover }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: 12,
                  paddingTop: 16,
                  color: theme.textSecondary,
                }}
              />

              {/* Barras Empilhadas para mostrar Sucesso, Compensações e Falhas */}
              <Bar
                dataKey="sucesso"
                name="Sucesso"
                stackId="a"
                fill={theme.accent}
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="compensado"
                name="Saga Compensada"
                stackId="a"
                fill={theme.warning}
              />
              <Bar
                dataKey="falha"
                name="Falha"
                stackId="a"
                fill={theme.danger}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Relatórios Recentes */}
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
              padding: "24px 32px",
              borderBottom: `1px solid ${theme.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(0,0,0,0.2)",
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: theme.textPrimary,
              }}
            >
              Ficheiros Gerados Recentemente
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: 6,
                padding: "6px 12px",
              }}
            >
              <Search size={12} color={theme.textSecondary} />
              <input
                placeholder="Procurar ficheiro..."
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: theme.textPrimary,
                  fontSize: 12,
                  width: 140,
                }}
              />
            </div>
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
                <tr>
                  {["Nome do Ficheiro", "Domínio", "Detalhes", "Ação"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: "16px 32px",
                          textAlign: "left",
                          fontSize: 11,
                          fontWeight: 600,
                          color: theme.textSecondary,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          borderBottom: `1px solid ${theme.border}`,
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {recentReports.map((report) => (
                  <tr
                    key={report.id}
                    style={{
                      borderBottom: `1px solid ${theme.border}`,
                      transition: "background 0.15s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = theme.surfaceHover)
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ padding: "16px 32px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            background: theme.surface,
                            padding: 8,
                            borderRadius: 8,
                            border: `1px solid ${theme.border}`,
                          }}
                        >
                          {getFormatIcon(report.format)}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: theme.textPrimary,
                              marginBottom: 4,
                            }}
                          >
                            {report.name}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: theme.textSecondary,
                              fontFamily: "var(--font-jetbrains-mono)",
                            }}
                          >
                            {report.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "16px 32px",
                        color: theme.textSecondary,
                      }}
                    >
                      {report.type}
                    </td>
                    <td style={{ padding: "16px 32px" }}>
                      <div
                        style={{
                          fontSize: 12,
                          color: theme.textSecondary,
                          marginBottom: 4,
                          fontFamily: "var(--font-jetbrains-mono)",
                        }}
                      >
                        {report.date}
                      </div>
                      <div style={{ fontSize: 11, color: theme.textSecondary }}>
                        {report.size} · {report.author}
                      </div>
                    </td>
                    <td style={{ padding: "16px 32px" }}>
                      <button
                        style={{
                          background: theme.bg,
                          border: `1px solid ${theme.border}`,
                          borderRadius: 8,
                          padding: "8px",
                          color: theme.textSecondary,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = theme.accent;
                          e.currentTarget.style.color = theme.accent;
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = theme.border;
                          e.currentTarget.style.color = theme.textSecondary;
                        }}
                        title="Descarregar novamente"
                      >
                        <Download size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
