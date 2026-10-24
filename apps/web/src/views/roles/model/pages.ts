import type { Route } from "next";
import type { PlannedPage } from "@/shared/config/planned-page";

/** Papéis, herança e membros (identity.Role, RolePermission, UserRole). */
export const rolePages = {
  list: {
    title: "Papéis",
    description: "Papéis de sistema e personalizados, com herança e quantidade de membros.",
    back: { href: "/users", label: "Usuários" },
    action: { href: "/users/roles/new", label: "Novo papel" },
  },
  create: {
    title: "Novo papel",
    description: "Defina nome, descrição, papel pai e permissões iniciais.",
    back: { href: "/users/roles", label: "Papéis" },
  },
  detail: (id: string): PlannedPage => ({
    title: "Papel",
    description: "Descrição, herança, permissões e membros deste papel.",
    back: { href: "/users/roles", label: "Papéis" },
    action: { href: `/users/roles/${id}/edit` as Route, label: "Editar papel" },
  }),
  edit: (id: string): PlannedPage => ({
    title: "Editar papel",
    description: "Ajuste nome, descrição e papel pai.",
    back: { href: `/users/roles/${id}` as Route, label: "Papel" },
  }),
  permissions: (id: string): PlannedPage => ({
    title: "Permissões do papel",
    description: "Ações concedidas por recurso, incluindo as herdadas do papel pai.",
    back: { href: `/users/roles/${id}` as Route, label: "Papel" },
  }),
  members: (id: string): PlannedPage => ({
    title: "Membros do papel",
    description: "Usuários com este papel, quem concedeu e quando expira.",
    back: { href: `/users/roles/${id}` as Route, label: "Papel" },
  }),
} satisfies Record<string, PlannedPage | ((...params: string[]) => PlannedPage)>;
