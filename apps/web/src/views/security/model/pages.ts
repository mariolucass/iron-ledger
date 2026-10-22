import type { PlannedPage } from "@/shared/config/planned-page";

/** Postura de segurança da conta (identity.UserSession, MfaFactor, FederatedIdentity). */
export const securityPages = {
  overview: {
    title: "Segurança",
    description: "Adoção de MFA, sessões ativas, bloqueios e chaves de API em um só lugar.",
  },
  sessions: {
    title: "Sessões ativas",
    description: "Sessões de todos os usuários, com dispositivo, IP, rotação e revogação.",
    back: { href: "/security", label: "Segurança" },
  },
  mfa: {
    title: "Autenticação multifator",
    description: "Fatores TOTP, WebAuthn, e-mail e códigos de recuperação por usuário.",
    back: { href: "/security", label: "Segurança" },
  },
  identities: {
    title: "Identidades federadas",
    description: "Vínculos com OIDC, SAML, Google, Microsoft e GitHub e último login de cada um.",
    back: { href: "/security", label: "Segurança" },
  },
  lockouts: {
    title: "Contas bloqueadas",
    description: "Usuários bloqueados ou com tentativas de login malsucedidas.",
    back: { href: "/security", label: "Segurança" },
  },
} satisfies Record<string, PlannedPage>;
