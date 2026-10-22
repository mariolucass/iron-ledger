import type { Route } from "next";

export interface KPI {
  label: string;
  value: string;
  /** Contexto curto abaixo do valor (ex.: variação ou janela de tempo). */
  detail: string;
  /** Tom do detalhe: `negative` só quando o número pede ação. */
  tone: "neutral" | "positive" | "negative";
  href: Route;
  sparkline: number[];
}

export interface DashboardTransaction {
  id: string;
  type: "ENTRADA" | "SAÍDA" | "AJUSTE";
  status: string;
  initiatedBy: string;
  timestamp: string;
  relativeTime: string;
}

export interface DashboardStockAlert {
  product: string;
  warehouse: string;
  current: number;
  min: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  category: string;
}

export const kpis: KPI[] = [
  {
    label: "SKUs em estoque",
    value: "4.821",
    detail: "+12 hoje",
    tone: "positive",
    href: "/inventory",
    sparkline: [4720, 4745, 4780, 4790, 4800, 4809, 4821],
  },
  {
    label: "Transações ativas",
    value: "38",
    detail: "6 em processamento",
    tone: "neutral",
    href: "/transactions",
    sparkline: [22, 31, 28, 35, 29, 34, 38],
  },
  {
    label: "Alertas pendentes",
    value: "14",
    detail: "3 de gravidade alta",
    tone: "negative",
    href: "/alerts",
    sparkline: [6, 9, 11, 8, 12, 10, 14],
  },
  {
    label: "Precisão da previsão",
    value: "94,2%",
    detail: "Últimos 30 dias",
    tone: "neutral",
    href: "/forecasting",
    sparkline: [88, 90, 89, 91, 93, 92, 94],
  },
];

export const dashboardRecentTransactions: DashboardTransaction[] = [
  {
    id: "TXN-00483921",
    type: "SAÍDA",
    status: "COMMITTED",
    initiatedBy: "vendas@ironledger",
    timestamp: "2026-06-09 14:32:01",
    relativeTime: "há 2 min",
  },
  {
    id: "TXN-00483920",
    type: "ENTRADA",
    status: "PROCESSING",
    initiatedBy: "estoque-centro@ironledger",
    timestamp: "2026-06-09 14:28:47",
    relativeTime: "há 5 min",
  },
  {
    id: "TXN-00483919",
    type: "AJUSTE",
    status: "FAILED",
    initiatedBy: "admin@ironledger",
    timestamp: "2026-06-09 14:11:03",
    relativeTime: "há 23 min",
  },
  {
    id: "TXN-00483918",
    type: "SAÍDA",
    status: "COMPENSATING",
    initiatedBy: "vendas@ironledger",
    timestamp: "2026-06-09 13:55:22",
    relativeTime: "há 39 min",
  },
  {
    id: "TXN-00483917",
    type: "ENTRADA",
    status: "COMMITTED",
    initiatedBy: "estoque-sul@ironledger",
    timestamp: "2026-06-09 13:40:10",
    relativeTime: "há 54 min",
  },
];

export const dashboardStockAlerts: DashboardStockAlert[] = [
  {
    product: "Tênis Esportivo Nike Air",
    warehouse: "Loja Centro",
    current: 2,
    min: 5,
    severity: "CRITICAL",
    category: "Calçados",
  },
  {
    product: "Camiseta de Algodão Premium",
    warehouse: "Estoque Sul",
    current: 8,
    min: 15,
    severity: "HIGH",
    category: "Vestuário",
  },
  {
    product: "Jaqueta de Couro Sintético",
    warehouse: "Loja Centro",
    current: 3,
    min: 8,
    severity: "CRITICAL",
    category: "Vestuário",
  },
];
