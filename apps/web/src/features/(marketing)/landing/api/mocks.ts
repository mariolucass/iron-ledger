import type {
  LandingFeature,
  LandingLinkGroup,
  LandingNavLink,
  LandingStat,
  LandingTechnology,
  LandingTestimonial,
} from "../model/types";

export const landingNavLinks: LandingNavLink[] = [
  { label: "Recursos", href: "#features" },
  { label: "Integrações", href: "#tech" },
  { label: "Depoimentos", href: "#testimonials" },
];

export const landingStats: LandingStat[] = [
  { value: 4_800_000, suffix: "+", label: "Transações processadas", duration: 2_000 },
  { value: 99, suffix: ",9%", label: "Disponibilidade do sistema", duration: 1_600 },
  { value: 200, prefix: "+", label: "Equipes usuárias", duration: 1_400 },
  { value: 50, suffix: "ms", label: "Latência média", duration: 1_200 },
];

export const landingFeatures: LandingFeature[] = [
  {
    icon: "shield",
    title: "Histórico de auditoria",
    description: "Cada alteração fica registrada com data, origem e responsável para facilitar conferências e investigações.",
    tone: "primary",
    size: "large",
  },
  {
    icon: "zap",
    title: "Atualizações em tempo real",
    description: "Entradas, saídas e transferências aparecem no sistema assim que são processadas.",
    tone: "blue",
    size: "small",
  },
  {
    icon: "git-branch",
    title: "Operações coordenadas",
    description: "Fluxos com várias etapas são acompanhados do início ao fim, inclusive quando alguma etapa precisa ser refeita.",
    tone: "purple",
    size: "small",
  },
  {
    icon: "trending-up",
    title: "Planejamento de estoque",
    description: "O histórico de vendas e a movimentação dos produtos ajudam a identificar reposições com antecedência.",
    tone: "emerald",
    size: "small",
  },
  {
    icon: "package",
    title: "Múltiplos estoques",
    description: "Acompanhe centros de distribuição, lojas e transferências entre unidades em uma única visão.",
    tone: "red",
    size: "small",
  },
  {
    icon: "check",
    title: "Conferência financeira",
    description: "Registros em partidas dobradas e relatórios organizados para apoiar o fechamento e a prestação de contas.",
    tone: "yellow",
    size: "large",
  },
];

export const landingTechnologies: LandingTechnology[] = [
  { name: "Kafka", icon: "database", tone: "orange" },
  { name: "RabbitMQ", icon: "git-branch", tone: "orange" },
  { name: "Temporal.io", icon: "globe", tone: "blue" },
  { name: "PostgreSQL", icon: "database", tone: "blue" },
  { name: "Redis", icon: "zap", tone: "red" },
  { name: "gRPC", icon: "globe", tone: "emerald" },
];

export const landingTestimonials: LandingTestimonial[] = [
  {
    quote: "Antes, conferir uma divergência levava boa parte da manhã. Agora conseguimos seguir o histórico da movimentação e encontrar a origem sem depender de várias planilhas.",
    author: "Luiz Felipe",
    role: "Coordenador Financeiro",
    initials: "LF",
    tone: "primary",
    stars: 5,
  },
  {
    quote: "A implantação foi tranquila e conseguimos manter os processos que a equipe já conhecia. O ganho maior foi ter estoque e financeiro olhando para os mesmos números.",
    author: "Pedro Ygor",
    role: "Gerente de Operações",
    initials: "PY",
    tone: "blue",
    stars: 5,
  },
  {
    quote: "Os alertas de reposição ajudaram a organizar melhor as compras. Hoje a equipe consegue perceber uma possível falta antes que ela vire um problema na loja.",
    author: "Mário Lucas",
    role: "Responsável por Suprimentos",
    initials: "ML",
    tone: "purple",
    stars: 5,
  },
];

export const landingFooterGroups: LandingLinkGroup[] = [
  { title: "Produto", links: ["Dashboard", "Estoque", "Transações", "Auditoria", "Previsões"] },
  { title: "Empresa", links: ["Sobre", "Blog", "Carreiras", "Contato", "Parceiros"] },
  { title: "Legal", links: ["Privacidade", "Termos", "Cookies", "Segurança", "Compliance"] },
];
