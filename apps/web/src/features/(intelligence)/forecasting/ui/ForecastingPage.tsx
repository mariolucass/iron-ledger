"use client";

import { colors as theme } from "@/shared/config/tokens";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, CheckCircle, Search } from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { staggerContainer, staggerItem } from "@/shared/lib/animation";
import { Layout } from "@/widgets/layout/Layout";

// 1. Tema "Cryptix" Integrado

import {
  Period,
  forecastSummary,
  generateData,
  periods,
  stockAlertsForecasting as stockAlerts,
} from "@/features/(intelligence)/forecasting/model/forecastingData";
import { mockWarehouses } from "@/features/(operations)/warehouses/model/warehousesData";

const severityColor = {
  CRITICAL: { color: "#FF1A1A", bg: "rgba(255, 26, 26, 0.12)" },
  HIGH: { color: theme.danger, bg: theme.dangerGlow },
  MEDIUM: { color: theme.warning, bg: theme.warningGlow },
  LOW: { color: theme.textSecondary, bg: theme.surfaceHover },
};

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
      {payload.map(
        (p: any, i: number) =>
          p.value != null && (
            <div
              key={i}
              style={{
                color: p.color === "#60a5fa" ? theme.accent : p.color,
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 4,
              }}
            >
              <span style={{ color: theme.textSecondary }}>{p.name}:</span>
              <strong style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                {p.value}
              </strong>
            </div>
          ),
      )}
    </div>
  );
};

export function ForecastingPage() {
  const [period, setPeriod] = useState<Period>("1 mês");
  const [search, setSearch] = useState("");
  const data = generateData(period);

  const minStock = 5;
  const crossingPoint = data.find(
    (d) => d.forecast !== null && d.forecast <= minStock,
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

  return (
    <Layout title="Previsão de Demanda">
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 24,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: theme.bg,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            padding: "0 14px",
            flex: 1,
            maxWidth: 360,
            transition: "all 0.2s",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = theme.accent;
            e.currentTarget.style.boxShadow = `0 0 0 1px ${theme.accent}, inset 0 2px 4px rgba(0,0,0,0.2)`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = theme.border;
            e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.2)";
          }}
        >
          <Search size={14} color={theme.textSecondary} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product or SKU..."
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

        <select
          style={{ ...inputStyle, cursor: "pointer", minWidth: 160 }}
          onFocus={(e) => (e.currentTarget.style.borderColor = theme.accent)}
          onBlur={(e) => (e.currentTarget.style.borderColor = theme.border)}
        >
          <option style={{ background: theme.bg }} value="">
            Todos os Armazéns
          </option>
          {mockWarehouses.map((wh) => (
            <option key={wh.id} style={{ background: theme.bg }} value={wh.id}>
              {wh.name}
            </option>
          ))}
        </select>

        <div
          style={{
            display: "flex",
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            padding: 4,
            gap: 4,
          }}
        >
          {periods.map((p) => {
            const isActive = period === p;
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "6px 16px",
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
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2-col main */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 24,
          marginBottom: 32,
        }}
      >
        {/* Chart Area */}
        <motion.div
          variants={staggerItem}
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
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: theme.textPrimary,
                  marginBottom: 6,
                }}
              >
                Tênis Esportivo Nike Air
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: theme.textSecondary,
                  fontFamily: "var(--font-jetbrains-mono)",
                }}
              >
                SKU-4821-A <span style={{ opacity: 0.5 }}>·</span> Loja Centro
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: theme.bg,
                padding: "8px 12px",
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
              }}
            >
              <Activity size={14} color={theme.accent} />
              <span style={{ fontSize: 12, color: theme.textSecondary }}>
                Modelo:{" "}
                <strong style={{ color: theme.textPrimary }}>ARIMA-X</strong>
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={theme.accent}
                    stopOpacity={0.2}
                  />
                  <stop offset="95%" stopColor={theme.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
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
                tickFormatter={(v) => v.slice(5)}
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={{ stroke: theme.border }}
                dy={10}
              />
              <YAxis
                tick={{
                  fontSize: 11,
                  fill: theme.textSecondary,
                  fontFamily: "var(--font-jetbrains-mono)",
                }}
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: theme.border,
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: 12,
                  color: theme.textSecondary,
                  paddingTop: 20,
                }}
                formatter={(value) => (
                  <span style={{ color: theme.textSecondary }}>{value}</span>
                )}
              />

              <ReferenceLine
                y={minStock}
                stroke={theme.danger}
                strokeDasharray="6 3"
                label={{
                  value: `MIN (${minStock})`,
                  position: "insideTopRight",
                  fill: theme.danger,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />

              {crossingPoint && (
                <ReferenceLine
                  x={crossingPoint.date}
                  stroke={theme.warning}
                  strokeDasharray="4 4"
                  label={{
                    value: "⚠ RUPTURA",
                    position: "insideTopLeft",
                    fill: theme.warning,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
              )}

              <Area
                type="monotone"
                dataKey="confidenceHigh"
                name="Confiança Alta"
                stroke="none"
                fill="url(#confGrad)"
                fillOpacity={1}
                legendType="none"
              />
              <Area
                type="monotone"
                dataKey="confidenceLow"
                name="Confiança Baixa"
                stroke="none"
                fill={theme.bg}
                fillOpacity={1}
                legendType="none"
              />

              <Line
                type="monotone"
                dataKey="historical"
                name="Histórico"
                stroke={theme.textPrimary}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                name="Previsão"
                stroke={theme.accent}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Forecast Summary Area */}
        <motion.div
          variants={staggerItem}
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
              fontSize: 14,
              fontWeight: 600,
              color: theme.textPrimary,
              marginBottom: 20,
            }}
          >
            Resumo de Projeção
          </div>

          <div
            style={{
              background: theme.bg,
              borderRadius: 8,
              padding: "20px",
              marginBottom: 24,
              border: `1px solid ${theme.border}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: 2,
                background: theme.danger,
              }}
            />
            <div
              style={{
                fontSize: 11,
                color: theme.textSecondary,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 600,
              }}
            >
              Estoque Atual
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: theme.danger,
                  lineHeight: 1,
                }}
              >
                2
              </div>
              <div style={{ fontSize: 12, color: theme.textSecondary }}>
                / Min: 5 unidades
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: 24,
            }}
          >
            {forecastSummary.map((f) => (
              <div
                key={f.label}
                style={{
                  background: theme.bg,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderLeft: `3px solid ${f.belowMin ? theme.danger : theme.accent}`,
                }}
              >
                <span style={{ fontSize: 13, color: theme.textSecondary }}>
                  Em {f.label}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      fontFamily: "var(--font-jetbrains-mono)",
                      color: f.belowMin ? theme.danger : theme.textPrimary,
                    }}
                  >
                    {f.value}
                  </span>
                  {f.belowMin && (
                    <AlertTriangle size={14} color={theme.danger} />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              background: theme.surfaceHover,
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: theme.textSecondary,
                fontWeight: 500,
              }}
            >
              Confiança do Modelo
            </span>
            <span
              style={{
                background: theme.accentGlow,
                color: theme.accent,
                borderRadius: 999,
                padding: "2px 10px",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              86%
            </span>
          </div>

          <div
            style={{
              background: theme.dangerGlow,
              border: `1px solid ${theme.danger}40`,
              borderRadius: 8,
              padding: "14px",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              marginTop: "auto",
            }}
          >
            <AlertTriangle
              size={16}
              color={theme.danger}
              style={{ flexShrink: 0, marginTop: 2 }}
            />
            <div>
              <div
                style={{
                  fontSize: 13,
                  color: theme.danger,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Alerta Crítico de Ruptura
              </div>
              <div style={{ fontSize: 12, color: theme.danger, opacity: 0.8 }}>
                Ruptura de estoque (stockout) prevista para os próximos 4 dias
                se não houver reposição.
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Alerts Section */}
      <div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: theme.textPrimary,
            marginBottom: 16,
          }}
        >
          Alertas Ativos Baseados em Previsão
        </div>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
          }}
        >
          {stockAlerts.map((alert) => {
            const style =
              severityColor[alert.severity as keyof typeof severityColor];
            return (
              <motion.div
                variants={staggerItem}
                key={alert.product}
                style={{
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderLeft: `4px solid ${style.color}`,
                  borderRadius: 12,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: theme.textPrimary,
                    }}
                  >
                    {alert.product}
                  </div>
                  <span
                    style={{
                      background: style.bg,
                      color: style.color,
                      borderRadius: 999,
                      padding: "2px 10px",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      flexShrink: 0,
                    }}
                  >
                    {alert.severity}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontSize: 12, color: theme.textSecondary }}>
                    {alert.warehouse}
                  </div>
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: theme.border,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 11,
                      color: theme.textSecondary,
                      fontFamily: "var(--font-jetbrains-mono)",
                    }}
                  >
                    {alert.createdAt}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: theme.textSecondary,
                    marginBottom: 24,
                    lineHeight: 1.5,
                  }}
                >
                  {alert.message}
                </div>

                <motion.button
                  whileHover={{
                    borderColor: style.color,
                    color: style.color,
                    backgroundColor: style.bg,
                  }}
                  style={{
                    marginTop: "auto",
                    background: "transparent",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    padding: "10px",
                    color: theme.textSecondary,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "all 0.2s",
                  }}
                >
                  <CheckCircle size={14} /> Marcar como Analisado
                </motion.button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </Layout>
  );
}
