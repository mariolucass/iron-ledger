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
  NavigationRecordMatch,
  NavigationRoute,
  NavigationSectionConfig,
} from "./app-navigation-types";

/**
 * Mapa de todas as páginas autenticadas, na ordem da barra lateral.
 *
 * - `children` são as listas e painéis do módulo; ações como "Novo …" ficam nos botões das telas.
 * - `records` são páginas de um registro (`[id]` aceita somente UUID) e aparecem quando a URL o identifica,
 *   agrupadas sob o nome do registro; `label` é o tipo exibido enquanto o nome carrega.
 * - `hidden` são rotas abertas por ações das telas, fora da barra lateral.
 * - Toda página autenticada precisa estar declarada em um desses lugares; o rótulo declarado é o da trilha.
 * - A seção vem da posição; o atalho Ctrl/⌘+⇧1–9 é declarado no item.
 */
const sections: NavigationSectionConfig[] = [
  {
    label: "Visão geral",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", shortcut: "1" },
      {
        icon: Bell,
        label: "Alertas",
        path: "/alerts",
        shortcut: "2",
        badge: "alerts",
        children: [
          { label: "Todos os alertas", path: "/alerts" },
          { label: "Regras", path: "/alerts/rules" },
        ],
        records: [
          { pattern: "/alerts/[id]", label: "Alerta", pages: [{ label: "Visão geral" }] },
          {
            pattern: "/alerts/rules/[id]",
            label: "Regra",
            pages: [
              { label: "Visão geral" },
              { label: "Editar", suffix: "/edit" },
              { label: "Assinantes", suffix: "/subscribers" },
            ],
          },
        ],
        hidden: [
          { label: "Nova regra", pattern: "/alerts/rules/new" },
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
        shortcut: "3",
        children: [
          { label: "Visão geral", path: "/inventory" },
          { label: "Saldos por localização", path: "/inventory/locations" },
          { label: "Movimentações", path: "/inventory/movements" },
          { label: "Reservas", path: "/inventory/reservations" },
          { label: "Lotes e séries", path: "/inventory/lots" },
          { label: "Transferências", path: "/inventory/transfers" },
          { label: "Contagens", path: "/inventory/counts" },
        ],
        records: [
          { pattern: "/inventory/movements/[id]", label: "Movimentação", pages: [{ label: "Visão geral" }] },
          { pattern: "/inventory/reservations/[id]", label: "Reserva", pages: [{ label: "Visão geral" }] },
          {
            pattern: "/inventory/lots/[id]",
            label: "Lote",
            pages: [{ label: "Visão geral" }, { label: "Rastreabilidade", suffix: "/traceability" }],
          },
          {
            pattern: "/inventory/transfers/[id]",
            label: "Transferência",
            pages: [
              { label: "Visão geral" },
              { label: "Editar", suffix: "/edit" },
              { label: "Recebimento", suffix: "/receive" },
            ],
          },
          {
            pattern: "/inventory/counts/[id]",
            label: "Contagem",
            pages: [
              { label: "Visão geral" },
              { label: "Apontamento", suffix: "/count" },
              { label: "Revisão", suffix: "/review" },
            ],
          },
        ],
        hidden: [
          { label: "Novo movimento", pattern: "/inventory/movements/new" },
          { label: "Nova transferência", pattern: "/inventory/transfers/new" },
          { label: "Nova contagem", pattern: "/inventory/counts/new" },
        ],
      },
      {
        icon: ArrowLeftRight,
        label: "Transações",
        path: "/transactions",
        shortcut: "4",
        children: [
          { label: "Todas as transações", path: "/transactions" },
        ],
        records: [
          {
            pattern: "/transactions/[id]",
            label: "Transação",
            pages: [
              { label: "Visão geral" },
              { label: "Etapas da saga", suffix: "/saga" },
              { label: "Histórico de status", suffix: "/history" },
              { label: "Auditoria", suffix: "/audit-log" },
            ],
          },
        ],
        hidden: [
          { label: "Nova transação", pattern: "/transactions/new" },
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
        shortcut: "5",
        children: [
          { label: "Todos os produtos", path: "/products" },
          { label: "Categorias", path: "/products/categories" },
          { label: "Unidades de medida", path: "/products/units-of-measure" },
        ],
        records: [
          {
            pattern: "/products/[id]",
            label: "Produto",
            pages: [
              { label: "Visão geral" },
              { label: "Editar", suffix: "/edit" },
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
            label: "Categoria",
            pages: [{ label: "Visão geral" }, { label: "Editar", suffix: "/edit" }],
          },
          { pattern: "/products/units-of-measure/[id]", label: "Unidade de medida", pages: [{ label: "Visão geral" }] },
        ],
        hidden: [
          { label: "Novo produto", pattern: "/products/new" },
          { label: "Importar produtos", pattern: "/products/import" },
          { label: "Nova categoria", pattern: "/products/categories/new" },
          { label: "Nova unidade de medida", pattern: "/products/units-of-measure/new" },
        ],
      },
      {
        icon: Warehouse,
        label: "Armazéns",
        path: "/warehouses",
        shortcut: "6",
        children: [
          { label: "Todos os armazéns", path: "/warehouses" },
          { label: "Estoque por armazém", path: "/warehouses/inventory" },
        ],
        records: [
          {
            pattern: "/warehouses/[id]",
            label: "Armazém",
            pages: [
              { label: "Visão geral" },
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
          { pattern: "/warehouses/[id]/locations/[locationId]", label: "Localização", pages: [{ label: "Visão geral" }] },
        ],
        hidden: [
          { label: "Novo armazém", pattern: "/warehouses/new" },
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
        shortcut: "7",
        children: [
          { label: "Visão geral", path: "/analytics" },
          { label: "Histórico de posições", path: "/analytics/snapshots" },
        ],
        hidden: [
          { label: "Pontos de inflexão", pattern: "/analytics/inflection-points", page: false },
          { label: "Ponto de inflexão", pattern: "/analytics/inflection-points/[slug]" },
        ],
      },
      {
        icon: TrendingUp,
        label: "Previsões",
        path: "/forecasting",
        shortcut: "8",
        children: [
          { label: "Visão geral", path: "/forecasting" },
          { label: "Execuções do modelo", path: "/forecasting/runs" },
        ],
        records: [{ pattern: "/forecasting/runs/[id]", label: "Execução", pages: [{ label: "Visão geral" }] }],
        hidden: [{ label: "Nova execução", pattern: "/forecasting/runs/new" }],
      },
      {
        icon: FileText,
        label: "Relatórios",
        path: "/reports",
        shortcut: "9",
        children: [
          { label: "Visão geral", path: "/reports" },
          { label: "Definições", path: "/reports/definitions" },
          { label: "Execuções", path: "/reports/runs" },
        ],
        records: [
          {
            pattern: "/reports/definitions/[id]",
            label: "Definição",
            pages: [{ label: "Visão geral" }, { label: "Editar", suffix: "/edit" }],
          },
          { pattern: "/reports/runs/[id]", label: "Execução", pages: [{ label: "Visão geral" }] },
        ],
        hidden: [{ label: "Nova definição", pattern: "/reports/definitions/new" }],
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
          { label: "Convites", path: "/users/invitations" },
          { label: "Papéis", path: "/users/roles" },
          { label: "Permissões", path: "/users/permissions" },
          { label: "Auditoria de usuários", path: "/users/audit-log" },
        ],
        records: [
          {
            pattern: "/users/[id]",
            label: "Usuário",
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
            label: "Papel",
            pages: [
              { label: "Visão geral" },
              { label: "Editar", suffix: "/edit" },
              { label: "Permissões", suffix: "/permissions" },
              { label: "Membros", suffix: "/members" },
            ],
          },
        ],
        hidden: [
          { label: "Novo usuário", pattern: "/users/new" },
          { label: "Novo papel", pattern: "/users/roles/new" },
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
        ],
        records: [{ pattern: "/security/api-keys/[id]", label: "Chave de API", pages: [{ label: "Visão geral" }] }],
        hidden: [{ label: "Nova chave de API", pattern: "/security/api-keys/new" }],
      },
      {
        icon: ScrollText,
        label: "Log de Auditoria",
        path: "/audit-log",
        children: [
          { label: "Todos os eventos", path: "/audit-log" },
          { label: "Integridade da cadeia", path: "/audit-log/integrity" },
        ],
        records: [{ pattern: "/audit-log/[id]", label: "Evento", pages: [{ label: "Visão geral" }] }],
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
          { label: "Eventos publicados", path: "/system/outbox" },
          { label: "Mensagens recebidas", path: "/system/inbox" },
          { label: "Chaves de idempotência", path: "/system/idempotency-keys" },
        ],
        records: [
          { pattern: "/system/feature-flags/[id]", label: "Feature flag", pages: [{ label: "Visão geral" }, { label: "Editar", suffix: "/edit" }] },
          { pattern: "/system/outbox/[id]", label: "Evento", pages: [{ label: "Visão geral" }] },
        ],
        hidden: [{ label: "Nova feature flag", pattern: "/system/feature-flags/new" }],
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

export const navigationItems: NavigationItem[] = sections.flatMap(({ label, items }) =>
  items.map((item) => ({ ...item, section: label })),
);

export const navigationShortcutItems = navigationItems.reduce((shortcuts, item) => {
  if (item.shortcut) shortcuts.set(item.shortcut, item);
  return shortcuts;
}, new Map<string, NavigationItem>());

export const navigationSections = sections.map(
  ({ label }) => [label, navigationItems.filter((item) => item.section === label)] as const,
);

/** Todas as rotas declaradas; na mesma rota vale a primeira declaração (o item antes de seus `children`). */
export const navigationRoutes: NavigationRoute[] = navigationItems
  .flatMap((item): NavigationRoute[] => [
    { label: item.label, pattern: item.path, page: true },
    ...(item.children ?? []).map(({ label, path }) => ({ label, pattern: path, page: true })),
    ...(item.records ?? []).flatMap(({ pattern, label, pages }) => [
      { label, pattern, page: true },
      ...pages.map(({ label, suffix = "" }) => ({ label, pattern: `${pattern}${suffix}`, page: true })),
    ]),
    ...(item.hidden ?? []).map(({ label, pattern, page = true }) => ({ label, pattern, page })),
  ])
  .filter((route, index, routes) => routes.findIndex(({ pattern }) => pattern === route.pattern) === index);

const isDynamic = (part: string) => part.startsWith("[");

/** Rota declarada para `pathname`; segmentos fixos têm prioridade sobre `[param]` (`/products/new` antes de `/products/[id]`). */
export function navigationRoute(pathname: string): NavigationRoute | undefined {
  const segments = pathname.split("/").filter(Boolean);
  let best: { route: NavigationRoute; fixed: number } | undefined;
  for (const route of navigationRoutes) {
    const expected = route.pattern.split("/").filter(Boolean);
    if (expected.length !== segments.length) continue;
    if (!expected.every((part, index) => isDynamic(part) || part === segments[index])) continue;
    const fixed = expected.filter((part) => !isDynamic(part)).length;
    if (!best || fixed > best.fixed) best = { route, fixed };
  }
  return best?.route;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Registro identificado quando `segments` começa pelo padrão; `[param]` aceita somente UUID. */
function matchRecord({ pattern, label, pages }: NavigationRecord, segments: string[]): NavigationRecordMatch | undefined {
  const expected = pattern.split("/").filter(Boolean);
  if (segments.length < expected.length) return undefined;
  const matches = expected.every((part, index) =>
    isDynamic(part) ? UUID.test(segments[index]!) : part === segments[index],
  );
  if (!matches) return undefined;
  return {
    pattern,
    label,
    path: `/${segments.slice(0, expected.length).join("/")}` as Route,
    params: segments.filter((_, index) => isDynamic(expected[index] ?? "")),
    pages,
  };
}

/** Registros identificados por `pathname`, do mais externo ao mais interno (armazém antes da localização). */
export function navigationRecordMatches(pathname: string, items = navigationItems): NavigationRecordMatch[] {
  const segments = pathname.split("/").filter(Boolean);
  return items.flatMap((item) =>
    (item.records ?? []).flatMap((record) => matchRecord(record, segments) ?? []),
  );
}

/** Acrescenta páginas de um registro somente quando seu ID está na rota atual. */
export function navigationChildren(item: NavigationItem, pathname: string): NavigationChild[] {
  const children = item.children ?? [];
  if (!item.records || !isNavigationItemActive(pathname, item.path)) return children;

  const scoped = navigationRecordMatches(pathname, [item]).flatMap((record) =>
    record.pages.map(({ label, suffix = "" }) => ({ label, path: `${record.path}${suffix}` as Route, record })),
  );
  return [...children, ...scoped];
}

export function isNavigationItemActive(pathname: string, path: string) {
  return pathname === path || (path !== "/dashboard" && pathname.startsWith(`${path}/`));
}
