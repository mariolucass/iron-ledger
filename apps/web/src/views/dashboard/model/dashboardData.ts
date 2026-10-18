import { ArrowLeftRight, Bell, Package, TrendingUp } from "lucide-react";
import React from "react";

export interface KPI {
  label: string;
  value: string;
  numericValue: number;
  icon: React.ElementType;
  change: string;
  changeUp: boolean;
  hasProcessing?: boolean;
  accentColor: string;
  sparkline: number[];
}

export interface DashboardTransaction {
  id: string;
  type: string;
  status: string;
  initiatedBy: string;
  timestamp: string;
  relativeTime: string;
  avatarInitials: string;
  avatarColor: string;
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
    label: "Total de SKUs em Estoque",
    value: "4.821",
    numericValue: 4821,
    icon: Package,
    change: "+12 hoje",
    changeUp: true,
    accentColor: "#00E5A0",
    sparkline: [4720, 4745, 4780, 4790, 4800, 4809, 4821],
  },
  {
    label: "Transações Ativas",
    value: "38",
    numericValue: 38,
    icon: ArrowLeftRight,
    change: "6 em processamento",
    changeUp: true,
    hasProcessing: true,
    accentColor: "#60A5FA",
    sparkline: [22, 31, 28, 35, 29, 34, 38],
  },
  {
    label: "Alertas Pendentes",
    value: "14",
    numericValue: 14,
    icon: Bell,
    change: "3 de gravidade alta",
    changeUp: false,
    accentColor: "#FF453A",
    sparkline: [6, 9, 11, 8, 12, 10, 14],
  },
  {
    label: "Precisão da Previsão",
    value: "94,2%",
    numericValue: 94.2,
    icon: TrendingUp,
    change: "Últimos 30 dias",
    changeUp: true,
    accentColor: "#A78BFA",
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
    avatarInitials: "VE",
    avatarColor: "#00E5A0",
  },
  {
    id: "TXN-00483920",
    type: "ENTRADA",
    status: "PROCESSING",
    initiatedBy: "estoque-centro@ironledger",
    timestamp: "2026-06-09 14:28:47",
    relativeTime: "há 5 min",
    avatarInitials: "EC",
    avatarColor: "#60A5FA",
  },
  {
    id: "TXN-00483919",
    type: "AJUSTE",
    status: "FAILED",
    initiatedBy: "admin@ironledger",
    timestamp: "2026-06-09 14:11:03",
    relativeTime: "há 23 min",
    avatarInitials: "AD",
    avatarColor: "#FF453A",
  },
  {
    id: "TXN-00483918",
    type: "SAÍDA",
    status: "COMPENSATING",
    initiatedBy: "vendas@ironledger",
    timestamp: "2026-06-09 13:55:22",
    relativeTime: "há 39 min",
    avatarInitials: "VE",
    avatarColor: "#F5A623",
  },
  {
    id: "TXN-00483917",
    type: "ENTRADA",
    status: "COMMITTED",
    initiatedBy: "estoque-sul@ironledger",
    timestamp: "2026-06-09 13:40:10",
    relativeTime: "há 54 min",
    avatarInitials: "ES",
    avatarColor: "#00E5A0",
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
