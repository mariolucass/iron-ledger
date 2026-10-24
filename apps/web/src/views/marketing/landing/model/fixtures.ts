import type {
  LandingFeature,
  LandingFlowNode,
  LandingLinkGroup,
  LandingNavLink,
  LandingStep,
} from "./types";

export const landingNavLinks: LandingNavLink[] = [
  { label: "Recursos", href: "#features" },
  { label: "Arquitetura", href: "#tech" },
  { label: "Como funciona", href: "#how" },
];

export const landingFeatures: LandingFeature[] = [
  {
    icon: "shield",
    title: "Histórico de cada alteração",
    description:
      "Quem mudou, o que mudou e quando. Movimentações e transações deixam um registro consultável, com o valor antes e depois.",
    sample: "quantidade  120 → 96",
    span: 4,
    tone: "primary",
  },
  {
    icon: "package",
    title: "Reservas de estoque",
    description: "Reserve unidades para uma operação, confirme a baixa ou libere. O disponível já desconta o reservado.",
    span: 2,
    tone: "blue",
  },
  {
    icon: "git-branch",
    title: "Transações que se desfazem",
    description: "Se uma etapa falha, a saga desfaz o que já foi feito. Nenhuma reserva fica presa no saldo.",
    span: 2,
    tone: "purple",
  },
  {
    icon: "boxes",
    title: "Catálogo completo",
    description: "SKU, categorias, unidades, códigos de barras, mínimo, máximo e NCM em um só cadastro.",
    span: 2,
    tone: "emerald",
  },
  {
    icon: "warehouse",
    title: "Armazéns e localizações",
    description: "Do centro de distribuição ao compartimento, com saldo e regras de separação por local.",
    sample: "CD-SP › A › 01 › R1",
    span: 2,
    tone: "orange",
  },
  {
    icon: "users",
    title: "Acesso por papéis",
    description: "Administradores, gestores de catálogo e de armazéns. Cada pessoa vê e altera só o que lhe cabe.",
    span: 3,
    tone: "yellow",
  },
  {
    icon: "trending-up",
    title: "Análise de mudanças",
    description:
      "Detecta alterações persistentes em vendas, cancelamentos e atrasos, por vendedor e por categoria, e explica cada uma.",
    span: 3,
    tone: "red",
  },
];

/** Caminho de um evento, da API até quem o consome. */
export const landingFlow: LandingFlowNode[] = [
  { icon: "globe", title: "API", detail: "Node.js, módulos por domínio", tone: "primary" },
  { icon: "database", title: "Outbox", detail: "PostgreSQL, na mesma transação do dado", tone: "blue" },
  { icon: "zap", title: "Mensageria", detail: "Kafka e RabbitMQ", tone: "orange" },
  { icon: "git-branch", title: "Orquestração", detail: "Temporal: saga e compensação", tone: "purple" },
  { icon: "activity", title: "Consumidores", detail: "Auditoria e analytics", tone: "emerald" },
];

export const landingStack = [
  "Next.js",
  "Node.js",
  "PostgreSQL",
  "Redis",
  "Kafka",
  "RabbitMQ",
  "Temporal",
  "OpenTelemetry",
] as const;

export const landingSteps: LandingStep[] = [
  {
    title: "Cadastre a base",
    description: "Produtos com SKU e política de reposição, e armazéns com as suas localizações.",
  },
  {
    title: "Registre a operação",
    description:
      "Entradas, saídas e ajustes, ou uma transação completa que reserva, confirma e concilia o saldo.",
  },
  {
    title: "Acompanhe e confira",
    description: "Saldos por armazém, o histórico de cada alteração e a análise do que mudou.",
  },
];

export const landingFooterGroups: LandingLinkGroup[] = [
  {
    title: "Produto",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Estoque", href: "/inventory" },
      { label: "Transações", href: "/transactions" },
      { label: "Auditoria", href: "/audit-log" },
      { label: "Previsões", href: "/forecasting" },
    ],
  },
  { title: "Empresa", links: [{ label: "Sobre" }, { label: "Blog" }, { label: "Carreiras" }, { label: "Contato" }, { label: "Parceiros" }] },
  { title: "Legal", links: [{ label: "Privacidade" }, { label: "Termos" }, { label: "Cookies" }, { label: "Segurança" }, { label: "Compliance" }] },
];
