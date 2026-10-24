import type { PlannedPage } from "@/shared/config/planned-page";

/** Segurança da conta do usuário logado (identity.UserSession, MfaFactor, FederatedIdentity, ApiKey). */
export const accountSecurityPages = {
  sessions: {
    title: "Minhas sessões",
    description: "Sessões registradas para sua conta, com estado e último uso.",
    back: { href: "/settings", label: "Configurações" },
  },
  mfa: {
    title: "Autenticação multifator",
    description: "Estado dos fatores de autenticação multifator da sua conta.",
    back: { href: "/settings", label: "Configurações" },
  },
  connectedAccounts: {
    title: "Contas conectadas",
    description: "Identidades federadas vinculadas à sua conta.",
    back: { href: "/settings", label: "Configurações" },
  },
  apiKeys: {
    title: "Minhas chaves de API",
    description: "Chaves pessoais para integrações, com permissões e validade.",
    back: { href: "/settings", label: "Configurações" },
  },
} satisfies Record<string, PlannedPage>;
