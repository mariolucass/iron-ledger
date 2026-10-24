import type { PlannedPage } from "@/shared/config/planned-page";

/** Catálogo de permissões (identity.Permission). */
export const permissionPages = {
  list: {
    title: "Permissões",
    description: "Recursos e ações disponíveis para papéis e chaves de API.",
    back: { href: "/users", label: "Usuários" },
  },
} satisfies Record<string, PlannedPage>;
