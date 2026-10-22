import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  FileText,
  LayoutDashboard,
  Package,
  PackageSearch,
  ScrollText,
  Server,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
  Warehouse,
} from "lucide-react";
import type { Route } from "next";
import type {
  NavigationChild,
  NavigationItem,
  NavigationRecord,
  NavigationSectionConfig,
  NavigationShortcut,
} from "./app-navigation-types";

/**
 * Mapa de todas as páginas autenticadas, na ordem da barra lateral.
 *
 * - `children` são páginas fixas do módulo.
 * - `records` são páginas de um registro (`[id]` aceita somente UUID) e aparecem quando a URL o identifica.
 * - Seção e atalho vêm da posição: os nove primeiros itens recebem Ctrl/⌘+⇧1–9.
 */
const sections: NavigationSectionConfig[] = [
  {
    label: "Visão geral",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      {
        icon: Bell,
        label: "Alertas",
        path: "/alerts",
        badge: 3,
        children: [
          { label: "Todos os alertas", path: "/alerts" },
          { label: "Regras", path: "/alerts/rules" },
          { label: "Nova regra", path: "/alerts/rules/new" },
        ],
        records: [
          { pattern: "/alerts/[id]", pages: [{ label: "Alerta" }] },
          {
            pattern: "/alerts/rules/[id]",
            pages: [
              { label: "Regra" },
              { label: "Editar", suffix: "/edit" },
              { label: "Assinantes", suffix: "/subscribers" },
            ],
          },
        ],
      },
    ],
  },
  {
    label: "Operação",
    items: [
      {
        icon: Package,
        label: "Estoque",
        path: "/inventory",
        children: [
          { label: "Visão geral", path: "/inventory" },
          { label: "Saldos por localização", path: "/inventory/locations" },
          { label: "Movimentações", path: "/inventory/movements" },
          { label: "Novo movimento", path: "/inventory/movements/new" },
          { label: "Reservas", path: "/inventory/reservations" },
          { label: "Lotes e séries", path: "/inventory/lots" },
          { label: "Transferências", path: "/inventory/transfers" },
          { label: "Contagens", path: "/inventory/counts" },
        ],
        records: [
          { pattern: "/inventory/movements/[id]", pages: [{ label: "Movimentação" }] },
          { pattern: "/inventory/reservations/[id]", pages: [{ label: "Reserva" }] },
          {
            pattern: "/inventory/lots/[id]",
            pages: [{ label: "Lote" }, { label: "Rastreabilidade", suffix: "/traceability" }],
          },
          {
            pattern: "/inventory/transfers/[id]",
            pages: [
              { label: "Transferência" },
              { label: "Editar", suffix: "/edit" },
              { label: "Recebimento", suffix: "/receive" },
            ],
          },
          {
            pattern: "/inventory/counts/[id]",
            pages: [
              { label: "Contagem" },
              { label: "Apontamento", suffix: "/count" },
              { label: "Revisão", suffix: "/review" },
            ],
          },
        ],
      },
      {
        icon: ArrowLeftRight,
        label: "Transações",
        path: "/transactions",
        children: [
          { label: "Todas as transações", path: "/transactions" },
          { label: "Nova transação", path: "/transactions/new" },
        ],
        records: [
          {
            pattern: "/transactions/[id]",
            pages: [
              { label: "Transação" },
              { label: "Etapas da saga", suffix: "/saga" },
              { label: "Histórico de status", suffix: "/history" },
              { label: "Auditoria", suffix: "/audit-log" },
            ],
          },
        ],
      },
    ],
  },
  {
    label: "Cadastros",
    items: [
      {
        icon: PackageSearch,
        label: "Produtos",
        path: "/products",
        children: [
          { label: "Todos os produtos", path: "/products" },
          { label: "Novo produto", path: "/products/new" },
          { label: "Categorias", path: "/products/categories" },
          { label: "Unidades de medida", path: "/products/units-of-measure" },
        ],
        records: [
          {
            pattern: "/products/[id]",
            pages: [
              { label: "Produto" },
              { label: "Estoque", suffix: "/inventory" },
              { label: "Movimentações", suffix: "/movements" },
              { label: "Lotes", suffix: "/lots" },
              { label: "Códigos de barras", suffix: "/barcodes" },
              { label: "Conversões de unidade", suffix: "/units" },
              { label: "Previsão de demanda", suffix: "/forecast" },
              { label: "Auditoria", suffix: "/audit-log" },
            ],
          },
          {
            pattern: "/products/categories/[id]",
            pages: [{ label: "Categoria" }, { label: "Editar", suffix: "/edit" }],
          },
          { pattern: "/products/units-of-measure/[id]", pages: [{ label: "Unidade de medida" }] },
        ],
      },
      {
        icon: Warehouse,
        label: "Armazéns",
        path: "/warehouses",
        children: [
          { label: "Todos os armazéns", path: "/warehouses" },
          { label: "Estoque por armazém", path: "/warehouses/inventory" },
          { label: "Novo armazém", path: "/warehouses/new" },
        ],
        records: [
          {
            pattern: "/warehouses/[id]",
            pages: [
              { label: "Armazém" },
              { label: "Editar", suffix: "/edit" },
              { label: "Estoque", suffix: "/inventory" },
              { label: "Localizações", suffix: "/locations" },
              { label: "Movimentações", suffix: "/movements" },
              { label: "Reservas", suffix: "/reservations" },
              { label: "Transferências", suffix: "/transfers" },
              { label: "Contagens", suffix: "/counts" },
              { label: "Acessos", suffix: "/access" },
              { label: "Parâmetros", suffix: "/settings" },
              { label: "Auditoria", suffix: "/audit-log" },
            ],
          },
          { pattern: "/warehouses/[id]/locations/[locationId]", pages: [{ label: "Localização" }] },
        ],
      },
    ],
  },
  {
    label: "Inteligência",
    items: [
      {
        icon: BarChart3,
        label: "Analytics",
        path: "/analytics",
        children: [
          { label: "Visão geral", path: "/analytics" },
          { label: "Histórico de posições", path: "/analytics/snapshots" },
        ],
      },
      {
        icon: TrendingUp,
        label: "Previsões",
        path: "/forecasting",
        children: [
          { label: "Visão geral", path: "/forecasting" },
          { label: "Execuções do modelo", path: "/forecasting/runs" },
          { label: "Nova execução", path: "/forecasting/runs/new" },
        ],
        records: [{ pattern: "/forecasting/runs/[id]", pages: [{ label: "Execução" }] }],
      },
      {
        icon: FileText,
        label: "Relatórios",
        path: "/reports",
        children: [
          { label: "Visão geral", path: "/reports" },
          { label: "Definições", path: "/reports/definitions" },
          { label: "Nova definição", path: "/reports/definitions/new" },
          { label: "Execuções", path: "/reports/runs" },
        ],
        records: [
          {
            pattern: "/reports/definitions/[id]",
            pages: [{ label: "Definição" }, { label: "Editar", suffix: "/edit" }],
          },
          { pattern: "/reports/runs/[id]", pages: [{ label: "Execução" }] },
        ],
      },
    ],
  },
  {
    label: "Administração",
    items: [
      {
        icon: Users,
        label: "Usuários",
        path: "/users",
        children: [
          { label: "Todos os usuários", path: "/users" },
          { label: "Novo usuário", path: "/users/new" },
          { label: "Convites", path: "/users/invitations" },
          { label: "Papéis", path: "/users/roles" },
          { label: "Permissões", path: "/users/permissions" },
          { label: "Auditoria de usuários", path: "/users/audit-log" },
        ],
        records: [
          {
            pattern: "/users/[id]",
            pages: [
              { label: "Perfil" },
              { label: "Editar", suffix: "/edit" },
              { label: "Papéis", suffix: "/roles" },
              { label: "Armazéns", suffix: "/warehouses" },
              { label: "Sessões", suffix: "/sessions" },
              { label: "Segurança", suffix: "/security" },
              { label: "Chaves de API", suffix: "/api-keys" },
              { label: "Auditoria", suffix: "/audit-log" },
            ],
          },
          {
            pattern: "/users/roles/[id]",
            pages: [
              { label: "Papel" },
              { label: "Editar", suffix: "/edit" },
              { label: "Permissões", suffix: "/permissions" },
              { label: "Membros", suffix: "/members" },
            ],
          },
        ],
      },
      {
        icon: ShieldCheck,
        label: "Segurança",
        path: "/security",
        children: [
          { label: "Visão geral", path: "/security" },
          { label: "Sessões ativas", path: "/security/sessions" },
          { label: "Autenticação multifator", path: "/security/mfa" },
          { label: "Identidades federadas", path: "/security/identities" },
          { label: "Contas bloqueadas", path: "/security/lockouts" },
          { label: "Chaves de API", path: "/security/api-keys" },
          { label: "Nova chave de API", path: "/security/api-keys/new" },
        ],
        records: [{ pattern: "/security/api-keys/[id]", pages: [{ label: "Chave de API" }] }],
      },
      {
        icon: ScrollText,
        label: "Log de Auditoria",
        path: "/audit-log",
        children: [
          { label: "Todos os eventos", path: "/audit-log" },
          { label: "Integridade da cadeia", path: "/audit-log/integrity" },
        ],
        records: [{ pattern: "/audit-log/[id]", pages: [{ label: "Evento" }] }],
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        icon: Server,
        label: "Plataforma",
        path: "/system",
        children: [
          { label: "Visão geral", path: "/system" },
          { label: "Parâmetros", path: "/system/settings" },
          { label: "Feature flags", path: "/system/feature-flags" },
          { label: "Nova feature flag", path: "/system/feature-flags/new" },
          { label: "Eventos publicados", path: "/system/outbox" },
          { label: "Mensagens recebidas", path: "/system/inbox" },
          { label: "Chaves de idempotência", path: "/system/idempotency-keys" },
        ],
        records: [
          { pattern: "/system/feature-flags/[id]", pages: [{ label: "Feature flag" }] },
          { pattern: "/system/outbox/[id]", pages: [{ label: "Evento" }] },
        ],
      },
      {
        icon: Settings,
        label: "Configurações",
        path: "/settings",
        children: [
          { label: "Preferências", path: "/settings" },
          { label: "Minhas sessões", path: "/settings/sessions" },
          { label: "Autenticação multifator", path: "/settings/mfa" },
          { label: "Contas conectadas", path: "/settings/connected-accounts" },
          { label: "Minhas chaves de API", path: "/settings/api-keys" },
        ],
      },
    ],
  },
];

const SHORTCUTS: readonly NavigationShortcut[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export const navigationItems: NavigationItem[] = sections
  .flatMap(({ label, items }) => items.map((item) => ({ ...item, section: label })))
  .map((item, index) => (SHORTCUTS[index] ? { ...item, shortcut: SHORTCUTS[index] } : item));

export const navigationShortcutItems = navigationItems.reduce((shortcuts, item) => {
  if (item.shortcut) shortcuts.set(item.shortcut, item);
  return shortcuts;
}, new Map<string, NavigationItem>());

export const navigationSections = sections.map(
  ({ label }) => [label, navigationItems.filter((item) => item.section === label)] as const,
);

export const pathLabels: Record<string, string> = {
  dashboard: "Dashboard",
  alerts: "Alertas",
  rules: "Regras",
  subscribers: "Assinantes",
  inventory: "Estoque",
  locations: "Localizações",
  movements: "Movimentações",
  reservations: "Reservas",
  lots: "Lotes",
  traceability: "Rastreabilidade",
  transfers: "Transferências",
  receive: "Recebimento",
  counts: "Contagens",
  count: "Apontamento",
  review: "Revisão",
  transactions: "Transações",
  saga: "Etapas da saga",
  history: "Histórico de status",
  products: "Produtos",
  categories: "Categorias",
  "units-of-measure": "Unidades de medida",
  units: "Conversões de unidade",
  barcodes: "Códigos de barras",
  forecast: "Previsão de demanda",
  warehouses: "Armazéns",
  access: "Acessos",
  analytics: "Analytics",
  "inflection-points": "Pontos de inflexão",
  snapshots: "Histórico de posições",
  forecasting: "Previsões",
  runs: "Execuções",
  reports: "Relatórios",
  definitions: "Definições",
  users: "Usuários",
  invitations: "Convites",
  roles: "Papéis",
  permissions: "Permissões",
  members: "Membros",
  security: "Segurança",
  sessions: "Sessões",
  mfa: "Autenticação multifator",
  identities: "Identidades federadas",
  lockouts: "Contas bloqueadas",
  "api-keys": "Chaves de API",
  "audit-log": "Log de Auditoria",
  integrity: "Integridade da cadeia",
  system: "Plataforma",
  "feature-flags": "Feature flags",
  outbox: "Eventos publicados",
  inbox: "Mensagens recebidas",
  "idempotency-keys": "Chaves de idempotência",
  settings: "Configurações",
  "connected-accounts": "Contas conectadas",
  "design-system": "Design System",
  new: "Novo",
  edit: "Editar",
};

/** Segmentos que agrupam rotas mas não têm página própria: a trilha os mostra como texto, sem link. */
export const nonLinkSegments: ReadonlySet<string> = new Set(["inflection-points"]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Rota do registro quando `segments` começa pelo padrão; `[param]` aceita somente UUID. */
function matchRecord({ pattern }: NavigationRecord, segments: string[]): string | undefined {
  const expected = pattern.split("/").filter(Boolean);
  if (segments.length < expected.length) return undefined;
  const matches = expected.every((part, index) =>
    part.startsWith("[") ? UUID.test(segments[index]!) : part === segments[index],
  );
  return matches ? `/${segments.slice(0, expected.length).join("/")}` : undefined;
}

/** Acrescenta páginas de um registro somente quando seu ID está na rota atual. */
export function navigationChildren(item: NavigationItem, pathname: string): NavigationChild[] {
  const children = item.children ?? [];
  if (!item.records || !isNavigationItemActive(pathname, item.path)) return children;

  const segments = pathname.split("/").filter(Boolean);
  const scoped = item.records.flatMap((record) => {
    const base = matchRecord(record, segments);
    if (!base) return [];
    return record.pages.map(({ label, suffix = "" }) => ({
      label,
      path: `${base}${suffix}` as Route,
      contextual: true,
    }));
  });
  return [...children, ...scoped];
}

export function isNavigationItemActive(pathname: string, path: string) {
  return pathname === path || (path !== "/dashboard" && pathname.startsWith(`${path}/`));
}
