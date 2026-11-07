"use client";

import { ArrowRight, Boxes, LineChart, Search } from "lucide-react";
import { useState } from "react";
import type { ForecastAccuracyDetail, ForecastAccuracyResponse } from "@/entities/analytics";
import { colors as theme } from "@/shared/config/tokens";
import { PageHeader } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";
import { ForecastAccuracySection } from "./ForecastAccuracySection";

const card = {
  background: theme.surface,
  border: `1px solid ${theme.border}`,
  borderRadius: 12,
} as const;

const inputs = [
  { title: "Estoque", detail: "saldo atual por produto e armazém" },
  { title: "Entradas", detail: "recebimentos e reposições (StockMovement)" },
  { title: "Saídas", detail: "vendas e baixas (StockMovement)" },
];

const outputs = [
  "Demanda prevista por semana, com intervalo de erro (limite inferior e superior)",
  "Data estimada de ruptura e quantidade sugerida de reposição",
  "Acurácia medida do próprio modelo em cada produto",
];

function Badge({ children, tone }: { children: string; tone: "pending" | "demo" }) {
  const color = tone === "pending" ? theme.warning : theme.textSecondary;
  const bg = tone === "pending" ? theme.warningGlow : theme.surfaceHover;
  return (
    <span
      style={{
        background: bg,
        color,
        borderRadius: 999,
        padding: "2px 10px",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}

function SectionTitle({
  id,
  title,
  badge,
  children,
}: {
  id: string;
  title: string;
  badge: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h2 id={id} style={{ fontSize: 16, fontWeight: 600, color: theme.textPrimary }}>
          {title}
        </h2>
        {badge}
      </div>
      <p style={{ fontSize: 13, color: theme.textSecondary, marginTop: 6, lineHeight: 1.5 }}>
        {children}
      </p>
    </div>
  );
}

function OwnProductsSection() {
  return (
    <section style={{ marginBottom: 40 }} aria-labelledby="own-products-title">
      <SectionTitle
        id="own-products-title"
        title="Previsão dos seus produtos"
        badge={<Badge tone="pending">Em integração</Badge>}
      >
        Previsão de demanda dos produtos cadastrados na API, calculada a partir do histórico de
        estoque, entradas e saídas com o modelo ARIMA, sempre acompanhada da margem de erro. Ainda
        não há previsão real aqui: o serviço de analytics hoje não lê os dados da API.
      </SectionTitle>

      <div style={{ ...card, padding: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 240px" }}>
            <div style={labelStyle}>O que o modelo recebe</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              {inputs.map((input) => (
                <div key={input.title} style={tileStyle}>
                  <Boxes size={14} color={theme.accent} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>
                      {input.title}
                    </div>
                    <div style={{ fontSize: 12, color: theme.textSecondary }}>{input.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", color: theme.textSecondary }}>
            <ArrowRight size={18} aria-hidden />
          </div>

          <div style={{ flex: "1 1 240px" }}>
            <div style={labelStyle}>O que você verá</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              {outputs.map((output) => (
                <div key={output} style={tileStyle}>
                  <LineChart size={14} color={theme.accent} style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 1.5 }}>
                    {output}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p style={{ fontSize: 12, color: theme.textSecondary, marginTop: 20, lineHeight: 1.5 }}>
          Próximos passos: expor movimentações e saldo na API, fazer o analytics consumi-las por
          HTTP, trocar a média móvel por ARIMA e publicar o resultado em <code>DemandForecast</code>
          . Depois, o mesmo pipeline pode receber um modelo de IA sem mudar esta tela.
        </p>
      </div>
    </section>
  );
}

const labelStyle = {
  fontSize: 11,
  color: theme.textSecondary,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  fontWeight: 600,
} as const;

const tileStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  background: theme.bg,
  border: `1px solid ${theme.border}`,
  borderRadius: 8,
  padding: "10px 12px",
} as const;

export function ForecastingPage({
  accuracy = null,
  detail = null,
}: {
  accuracy?: ForecastAccuracyResponse | null;
  detail?: ForecastAccuracyDetail | null;
}) {
  const [search, setSearch] = useState("");

  return (
    <Layout title="Previsão de Demanda">
      <PageHeader
        title="Previsão de demanda"
        description="Quanto cada produto deve vender nas próximas semanas e quando o estoque acaba."
      />

      <OwnProductsSection />

      <section aria-labelledby="validation-title">
        <SectionTitle
          id="validation-title"
          title="Validação do modelo"
          badge={<Badge tone="demo">Dados de demonstração</Badge>}
        >
          Teste do método de previsão sobre o dataset público da Olist (pedidos de marketplaces
          brasileiros). Os produtos abaixo não são os seus: servem para medir o erro do modelo
          antes de aplicá-lo ao seu catálogo. O modelo atual é média móvel; o ARIMA ainda não foi
          implementado.
        </SectionTitle>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: theme.bg,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            padding: "0 14px",
            maxWidth: 360,
            marginBottom: 20,
          }}
        >
          <Search size={14} color={theme.textSecondary} aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto ou categoria da Olist..."
            aria-label="Buscar produto ou categoria da Olist"
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

        <ForecastAccuracySection accuracy={accuracy} detail={detail} search={search} />
      </section>
    </Layout>
  );
}
