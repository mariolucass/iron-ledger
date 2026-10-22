import type { PlannedPage } from "@/shared/config/planned-page";

/** Segurança da conta do usuário logado (identity.UserSession, MfaFactor, FederatedIdentity, ApiKey). */
export const accountSecurityPages = {
  sessions: {
    title: "Minhas sessões",
    description: "Dispositivos conectados à sua conta e encerramento de sessões.",
    back: { href: "/settings", label: "Configurações" },
  },
  mfa: {
    title: "Autenticação multifator",
    description: "Cadastre aplicativos autenticadores, chaves de segurança e códigos de recuperação.",
    back: { href: "/settings", label: "Configurações" },
  },
  connectedAccounts: {
    title: "Contas conectadas",
    description: "Login com Google, Microsoft, GitHub e provedores corporativos.",
    back: { href: "/settings", label: "Configurações" },
  },
  apiKeys: {
    title: "Minhas chaves de API",
    description: "Chaves pessoais para integrações, com permissões e validade.",
    back: { href: "/settings", label: "Configurações" },
  },
} satisfies Record<string, PlannedPage>;
