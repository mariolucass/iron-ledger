"use client";

import { colors as theme } from "@/shared/config/tokens";
import {
  Activity,
  AlertTriangle,
  Box,
  ChevronRight,
  Filter,
  MapPin,
  Package,
  Plus,
  Search,
  Thermometer,
  ThermometerSnowflake,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Layout } from "@/widgets/layout";

// 1. Tema "Cryptix" Integrado

import { mockWarehouses, type DemoWarehouse as Warehouse } from "@/entities/warehouse/testing";

// Utilitários Visuais
const getStatusColor = (status: Warehouse["status"]) => {
  if (status === "OPERACIONAL")
    return { color: theme.accent, bg: theme.accentGlow };
  if (status === "MANUTENÇÃO")
    return { color: theme.warning, bg: theme.warningGlow };
  return { color: theme.danger, bg: theme.dangerGlow }; // CRÍTICO
};

const getCapacityColor = (percentage: number) => {
  if (percentage >= 95) return theme.danger;
  if (percentage >= 80) return theme.warning;
  return theme.accent;
};

// 3. Sub-componentes
function ProgressBar({ used, total }: { used: number; total: number }) {
  const percentage = Math.round((used / total) * 100);
  const color = getCapacityColor(percentage);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          marginBottom: 6,
        }}
      >
        <span style={{ color: theme.textSecondary }}>Ocupação</span>
        <span
          style={{
            fontWeight: 700,
            color: theme.textPrimary,
            fontFamily: "var(--font-jetbrains-mono)",
          }}
        >
          {percentage}%
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: "rgba(255,255,255,0.1)",
          borderRadius: 3,
          overflow: "hidden",
          display: "flex",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            background: color,
            boxShadow: `0 0 8px ${color}80`,
            transition: "width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
        />
      </div>
      <div
        style={{
          fontSize: 11,
          color: theme.textSecondary,
          marginTop: 6,
          textAlign: "right",
          fontFamily: "var(--font-jetbrains-mono)",
        }}
      >
        {used.toLocaleString()} / {total.toLocaleString()} paletes
      </div>
    </div>
  );
}

function WarehouseDrawer({
  warehouse,
  onClose,
}: {
  warehouse: Warehouse;
  onClose: () => void;
}) {
  const statusCfg = getStatusColor(warehouse.status);
  const percentTotal = Math.round(
    (warehouse.capacityUsed / warehouse.capacityTotal) * 100,
  );

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
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          animation: "fade-in 0.2s ease-out",
        }}
        onClick={onClose}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 540,
          background: theme.bg,
          borderLeft: `1px solid ${theme.border}`,
          padding: 32,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 32,
          animation: "slide-in 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
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
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontFamily: "var(--font-jetbrains-mono)",
                  color: theme.accent,
                }}
              >
                {warehouse.id}
              </span>
              <span
                style={{
                  background: statusCfg.bg,
                  color: statusCfg.color,
                  padding: "2px 8px",
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                }}
              >
                {warehouse.status}
              </span>
            </div>
            <h2
              style={{
                margin: "0 0 8px",
                fontSize: 24,
                fontWeight: 700,
                color: theme.textPrimary,
              }}
            >
              {warehouse.name}
            </h2>
            <div
              style={{
                fontSize: 13,
                color: theme.textSecondary,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <MapPin size={14} /> {warehouse.location}
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
              e.currentTarget.style.color = theme.textPrimary;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = theme.textSecondary;
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* KPIs Pessoais do Armazém */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <div
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: theme.textSecondary,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <Box size={14} /> Capacidade Global
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: getCapacityColor(percentTotal),
                marginBottom: 12,
              }}
            >
              {percentTotal}%
            </div>
            <ProgressBar
              used={warehouse.capacityUsed}
              total={warehouse.capacityTotal}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: theme.textSecondary,
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <Thermometer size={14} /> Temp Média
              </div>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: theme.textPrimary,
                  fontFamily: "var(--font-jetbrains-mono)",
                }}
              >
                {warehouse.avgTemp}
              </span>
            </div>

            <div
              style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: theme.textSecondary,
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <Users size={14} /> Operadores
              </div>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: theme.textPrimary,
                  fontFamily: "var(--font-jetbrains-mono)",
                }}
              >
                {warehouse.workersActive} ativos
              </span>
            </div>
          </div>
        </div>

        {/* Mapa de Zonas */}
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: theme.textPrimary,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Activity size={16} color={theme.accent} /> Mapeamento de Zonas
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {warehouse.zones.map((zone) => {
              const zPercent = Math.round(
                (zone.capacityUsed / zone.capacityTotal) * 100,
              );
              const zColor = getCapacityColor(zPercent);

              return (
                <div
                  key={zone.id}
                  style={{
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    padding: 16,
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
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: theme.textPrimary,
                          marginBottom: 4,
                        }}
                      >
                        {zone.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: theme.textSecondary,
                          fontFamily: "var(--font-jetbrains-mono)",
                        }}
                      >
                        {zone.id} · {zone.type}
                      </div>
                    </div>
                    {zone.temp && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          background: theme.infoGlow,
                          color: theme.info,
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        <ThermometerSnowflake size={12} /> {zone.temp}
                      </div>
                    )}
                  </div>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: 4,
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${zPercent}%`,
                          height: "100%",
                          background: zColor,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: zColor,
                        fontFamily: "var(--font-jetbrains-mono)",
                        width: 36,
                        textAlign: "right",
                      }}
                    >
                      {zPercent}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alertas Ativos (Mocked) */}
        {warehouse.status !== "OPERACIONAL" && (
          <div
            style={{
              background: theme.warningGlow,
              border: `1px solid ${theme.warning}40`,
              borderRadius: 8,
              padding: 16,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <AlertTriangle
              size={18}
              color={theme.warning}
              style={{ marginTop: 2 }}
            />
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: theme.warning,
                  marginBottom: 4,
                }}
              >
                Atenção Requerida
              </div>
              <div style={{ fontSize: 12, color: theme.warning, opacity: 0.8 }}>
                Este armazém atingiu limites críticos de ocupação ou encontra-se
                em manutenção programada.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 4. Componente Principal
export function WarehousesPage() {
  const [search, setSearch] = useState("");
  const [drawerWh, setDrawerWh] = useState<Warehouse | null>(null);

  const filteredWarehouses = mockWarehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.location.toLowerCase().includes(search.toLowerCase()) ||
      w.id.toLowerCase().includes(search.toLowerCase()),
  );

  const totalCapacity = mockWarehouses.reduce(
    (acc, curr) => acc + curr.capacityTotal,
    0,
  );
  const usedCapacity = mockWarehouses.reduce(
    (acc, curr) => acc + curr.capacityUsed,
    0,
  );
  const globalOccupancy = Math.round((usedCapacity / totalCapacity) * 100);

  return (
    <Layout title="Gestão de Armazéns (Facilities)">
      <style>{`
        @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* Top Level KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            padding: 24,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: theme.accentGlow,
            }}
          >
            <Package size={20} color={theme.accent} />
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                color: theme.textSecondary,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 4,
              }}
            >
              Armazéns Ativos
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: theme.textPrimary,
              }}
            >
              {mockWarehouses.length}
            </div>
          </div>
        </div>

        <div
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            padding: 24,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: theme.surfaceHover,
              border: `1px solid ${theme.border}`,
            }}
          >
            <Box size={20} color={theme.textPrimary} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 12,
                color: theme.textSecondary,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 4,
              }}
            >
              Ocupação Global
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: theme.textPrimary,
                }}
              >
                {globalOccupancy}%
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: theme.textSecondary,
                  fontFamily: "var(--font-jetbrains-mono)",
                }}
              >
                {usedCapacity.toLocaleString()} un
              </span>
            </div>
            <div
              style={{
                height: 4,
                background: "rgba(255,255,255,0.1)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${globalOccupancy}%`,
                  height: "100%",
                  background: theme.accent,
                  boxShadow: `0 0 8px ${theme.accent}80`,
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            padding: 24,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: theme.infoGlow,
            }}
          >
            <Zap size={20} color={theme.info} />
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                color: theme.textSecondary,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 4,
              }}
            >
              Zonas Mapeadas
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: theme.textPrimary,
              }}
            >
              {mockWarehouses.reduce((acc, curr) => acc + curr.zones.length, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Controles */}
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
        <div
          style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: "0 14px",
              flex: 1,
              maxWidth: 360,
              transition: "all 0.2s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme.accent;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = theme.border;
            }}
          >
            <Search size={14} color={theme.textSecondary} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Procurar por nome, ID ou localização..."
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

          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: "10px 16px",
              color: theme.textSecondary,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.color = theme.textPrimary)
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.color = theme.textSecondary)
            }
          >
            <Filter size={14} /> Filtros
          </button>
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
          <Plus size={16} /> Registar Instalação
        </button>
      </div>

      {/* Warehouse Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
          gap: 24,
        }}
      >
        {filteredWarehouses.map((wh) => {
          const statusCfg = getStatusColor(wh.status);

          return (
            <div
              key={wh.id}
              onClick={() => setDrawerWh(wh)}
              style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                padding: 24,
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.4)`;
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = theme.border;
              }}
            >
              {/* Brilho Superior */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: 2,
                  background: statusCfg.color,
                  opacity: 0.8,
                  boxShadow: `0 0 8px ${statusCfg.color}`,
                }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: 20,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontFamily: "var(--font-jetbrains-mono)",
                      color: theme.textSecondary,
                      marginBottom: 4,
                    }}
                  >
                    {wh.id}
                  </div>
                  <h3
                    style={{
                      margin: "0 0 4px",
                      fontSize: 18,
                      fontWeight: 700,
                      color: theme.textPrimary,
                    }}
                  >
                    {wh.name}
                  </h3>
                  <div
                    style={{
                      fontSize: 12,
                      color: theme.textSecondary,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <MapPin size={12} /> {wh.location}
                  </div>
                </div>
                <div
                  style={{
                    background: statusCfg.bg,
                    color: statusCfg.color,
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                  }}
                >
                  {wh.status}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <ProgressBar used={wh.capacityUsed} total={wh.capacityTotal} />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  borderTop: `1px solid ${theme.border}`,
                  paddingTop: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: theme.textSecondary,
                    fontSize: 12,
                  }}
                >
                  <Users size={14} /> {wh.workersActive}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: theme.textSecondary,
                    fontSize: 12,
                  }}
                >
                  <Thermometer size={14} />{" "}
                  <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                    {wh.avgTemp}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: theme.textSecondary,
                    fontSize: 12,
                    marginLeft: "auto",
                  }}
                >
                  Ver Detalhes <ChevronRight size={14} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawer */}
      {drawerWh && (
        <WarehouseDrawer
          warehouse={drawerWh}
          onClose={() => setDrawerWh(null)}
        />
      )}
    </Layout>
  );
}
