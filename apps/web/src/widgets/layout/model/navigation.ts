import { ArrowLeftRight, BarChart3, Bell, LayoutDashboard, Package, PackageSearch, ScrollText, Settings, TrendingUp, Users, Warehouse } from "lucide-react";
import type { NavigationItem } from "./types";

export const navigationItems: NavigationItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", section: "Principal", shortcut: "⌘1" },
  { icon: Package, label: "Estoque", path: "/inventory", section: "Principal", shortcut: "⌘2" },
  { icon: PackageSearch, label: "Produtos", path: "/products", section: "Principal" },
  { icon: Warehouse, label: "Armazéns", path: "/warehouses", section: "Principal", shortcut: "⌘3" },
  { icon: ArrowLeftRight, label: "Transações", path: "/transactions", section: "Principal", shortcut: "⌘4" },
  { icon: ScrollText, label: "Log de Auditoria", path: "/audit-log", section: "Análises", shortcut: "⌘5" },
  { icon: TrendingUp, label: "Previsões", path: "/forecasting", section: "Análises", shortcut: "⌘6" },
  { icon: BarChart3, label: "Relatórios", path: "/reports", section: "Análises", shortcut: "⌘7" },
  { icon: Bell, label: "Alertas", path: "/alerts", section: "Análises", shortcut: "⌘8", badge: 3 },
  { icon: BarChart3, label: "Analytics", path: "/analytics", section: "Análises" },
  { icon: Users, label: "Usuários", path: "/users", section: "Sistema", shortcut: "⌘9" },
  { icon: Settings, label: "Configurações", path: "/settings", section: "Sistema" },
];

export const navigationSections = Object.entries(
  navigationItems.reduce<Record<string, NavigationItem[]>>((sections, item) => {
    (sections[item.section] ??= []).push(item);
    return sections;
  }, {}),
);

export const pathLabels: Record<string, string> = {
  dashboard: "Dashboard",
  inventory: "Estoque",
  products: "Produtos",
  new: "Novo",
  warehouses: "Armazéns",
  transactions: "Transações",
  "audit-log": "Log de Auditoria",
  forecasting: "Previsões",
  reports: "Relatórios",
  analytics: "Analytics",
  "inflection-points": "Pontos de inflexão",
  alerts: "Alertas",
  users: "Usuários",
  settings: "Configurações",
  "design-system": "Design System",
};

/** Segmentos que agrupam rotas mas não têm página própria: a trilha os mostra como texto, sem link. */
export const nonLinkSegments: ReadonlySet<string> = new Set(["inflection-points"]);

export function isNavigationItemActive(pathname: string, path: string) {
  return pathname === path || (path !== "/dashboard" && pathname.startsWith(`${path}/`));
}
