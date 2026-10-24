export const periods = ["7 dias", "1 mês", "3 meses", "6 meses"] as const;
export type Period = (typeof periods)[number];

// Simula tendência + sazonalidade + ruído — mais realista que random puro
const generateTrend = (i: number, slope: number, noise: number) =>
  Math.round(slope * i + (Math.random() - 0.5) * noise);

export const generateData = (period: Period) => {
  const days = period === "7 dias" ? 7 : period === "1 mês" ? 30 : period === "3 meses" ? 90 : 180;
  const histDays = Math.floor(days * 0.65);
  const futureDays = days - histDays;

  // Parâmetros por período — quanto mais longo, mais spread na confiança
  const config = {
    "7 dias": {
      baseQty: 58,
      slope: -0.6,
      noise: 4,
      spreadBase: 2,
      spreadGrowth: 0.4,
    },
    "1 mês": {
      baseQty: 58,
      slope: -0.5,
      noise: 7,
      spreadBase: 3,
      spreadGrowth: 0.7,
    },
    "3 meses": {
      baseQty: 58,
      slope: -0.4,
      noise: 10,
      spreadBase: 4,
      spreadGrowth: 1.1,
    },
    "6 meses": {
      baseQty: 58,
      slope: -0.3,
      noise: 14,
      spreadBase: 5,
      spreadGrowth: 1.5,
    },
  }[period];

  const data: {
    date: string;
    historical: number | null;
    forecast: number | null;
    confidenceLow: number | null;
    confidenceHigh: number | null;
  }[] = [];

  const today = new Date("2026-06-09");

  // Histórico — tendência de queda gradual com ruído controlado
  for (let i = -histDays; i <= 0; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);

    // Pico nos fins de semana simulando sazonalidade de demanda
    const dayOfWeek = d.getDay();
    const weekendBump = dayOfWeek === 0 || dayOfWeek === 6 ? 3 : 0;

    const qty = Math.max(
      0,
      config.baseQty + generateTrend(i, config.slope, config.noise) + weekendBump,
    );

    data.push({
      date: d.toISOString().slice(0, 10),
      historical: qty,
      forecast: null,
      confidenceLow: null,
      confidenceHigh: null,
    });
  }

  // Ponto de transição — última quantidade histórica real
  const lastHistorical = data[data.length - 1].historical ?? config.baseQty;

  // Previsão — banda de confiança cresce com o tempo (incerteza acumula)
  for (let i = 1; i <= futureDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);

    const forecast = Math.max(
      0,
      lastHistorical + generateTrend(i, config.slope * 1.2, config.noise * 0.6),
    );

    // Spread cresce progressivamente — quanto mais longe, menos certeza
    const spread = Math.round(config.spreadBase + i * config.spreadGrowth);

    data.push({
      date: d.toISOString().slice(0, 10),
      historical: null,
      forecast,
      confidenceLow: Math.max(0, forecast - spread),
      confidenceHigh: forecast + spread,
    });
  }

  return data;
};

// ----------------------------------------------------------------
// Produto selecionado no dashboard de previsão
// ----------------------------------------------------------------
export const selectedProduct = {
  sku: "SKU-4821-A",
  name: "Tênis Esportivo Nike Air",
  warehouse: "Loja Centro",
  unit: "un",
  currentStock: 2,
  minStock: 5,
  model: "ARIMA-X",
  confidence: 84,
  lastUpdated: "2026-06-09 13:50",
};

// ----------------------------------------------------------------
// Resumo de previsão por horizonte
// ----------------------------------------------------------------
export const forecastSummary = [
  {
    label: "7 dias",
    value: 38,
    belowMin: false,
    trend: "stable",
    delta: -9,
  },
  {
    label: "30 dias",
    value: 21,
    belowMin: false,
    trend: "declining",
    delta: -26,
  },
  {
    label: "90 dias",
    value: 8,
    belowMin: true,
    trend: "critical",
    delta: -39,
    alertDaysUntil: 54,
  },
];

// ----------------------------------------------------------------
// Alertas de estoque — contexto operacional real
// ----------------------------------------------------------------
export const stockAlertsForecasting = [
  {
    id: "ALT-0091",
    product: "Tênis Esportivo Nike Air",
    sku: "SKU-4821-A",
    warehouse: "Loja Centro",
    severity: "CRITICAL",
    message: "Previsão de ruptura em poucas horas com 84% de confiança. Quantidade atual: 2 un.",
    recommendedOrder: 120,
    createdAt: "2026-06-09 13:50",
    resolved: false,
  },
  {
    id: "ALT-0086",
    product: "Camiseta de Algodão Premium",
    sku: "SKU-3910-B",
    warehouse: "Estoque Sul",
    severity: "HIGH",
    message: "Estoque atual (8 un) abaixo do mínimo (15 un). Demanda crescente detectada.",
    recommendedOrder: 80,
    createdAt: "2026-06-09 07:48",
    resolved: false,
  },
  {
    id: "ALT-0085",
    product: "Jaqueta de Couro Sintético",
    sku: "SKU-2201-C",
    warehouse: "Loja Centro",
    severity: "MEDIUM",
    message: "Queda de 38% no estoque nos últimos 14 dias. Previsão de mínimo em 11 dias.",
    recommendedOrder: 40,
    createdAt: "2026-06-08 09:10",
    resolved: false,
  },
  {
    id: "ALT-0079",
    product: "Calça Jeans Slim Fit",
    sku: "SKU-1092-D",
    warehouse: "Estoque Norte",
    severity: "LOW",
    message: "Consumo acima da média histórica. Monitorar próximos 7 dias.",
    recommendedOrder: 20,
    createdAt: "2026-06-07 14:00",
    resolved: false,
  },
  {
    id: "ALT-0071",
    product: "Moletom com Capuz",
    sku: "SKU-7832-F",
    warehouse: "Loja Centro",
    severity: "MEDIUM",
    message: "Fornecedor com lead time de 21 dias. Reposição urgente recomendada.",
    recommendedOrder: 15,
    createdAt: "2026-06-06 11:20",
    resolved: false,
  },
];
