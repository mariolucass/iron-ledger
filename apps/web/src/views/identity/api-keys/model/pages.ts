import type { PlannedPage } from "@/shared/config/planned-page";

/** Chaves de API (identity.ApiKey, ApiKeyPermission). */
export const apiKeyPages = {
  list: {
    title: "Chaves de API",
    description: "Chaves ativas, revogadas e expiradas, com dono, prefixo e último uso.",
    back: { href: "/security", label: "Segurança" },
    action: { href: "/security/api-keys/new", label: "Nova chave" },
  },
  create: {
    title: "Nova chave de API",
    description: "Defina nome, dono, permissões, IPs permitidos e validade.",
    back: { href: "/security/api-keys", label: "Chaves de API" },
  },
  detail: {
    title: "Chave de API",
    description: "Permissões, IPs permitidos, validade e revogação da chave.",
    back: { href: "/security/api-keys", label: "Chaves de API" },
  },
} satisfies Record<string, PlannedPage>;
