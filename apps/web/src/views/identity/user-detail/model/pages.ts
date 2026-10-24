import type { Route } from "next";
import type { PlannedPage } from "@/shared/config/planned-page";

/** Páginas de um usuário (identity.User e relações). */
export const userDetailPages = {
  profile: (id: string): PlannedPage => ({
    title: "Usuário",
    description: "Apresentação do perfil, acessos e atividades do usuário.",
    back: { href: "/users", label: "Usuários" },
    action: { href: `/users/${id}/edit` as Route, label: "Editar usuário" },
  }),
  roles: (id: string): PlannedPage => ({
    title: "Papéis do usuário",
    description: "Papéis atribuídos, quando foram concedidos e quando expiram.",
    back: { href: `/users/${id}` as Route, label: "Usuário" },
  }),
  warehouses: (id: string): PlannedPage => ({
    title: "Armazéns do usuário",
    description: "Acessos deste usuário aos armazéns.",
    back: { href: `/users/${id}` as Route, label: "Usuário" },
  }),
  sessions: (id: string): PlannedPage => ({
    title: "Sessões do usuário",
    description: "Sessões ativas e encerradas, com dispositivo, IP e último uso.",
    back: { href: `/users/${id}` as Route, label: "Usuário" },
  }),
  security: (id: string): PlannedPage => ({
    title: "Segurança do usuário",
    description: "Fatores de autenticação, identidades federadas, tentativas de login e bloqueios.",
    back: { href: `/users/${id}` as Route, label: "Usuário" },
  }),
  apiKeys: (id: string): PlannedPage => ({
    title: "Chaves de API do usuário",
    description: "Chaves emitidas para este usuário, com permissões, IPs permitidos e último uso.",
    back: { href: `/users/${id}` as Route, label: "Usuário" },
  }),
  auditLog: (id: string): PlannedPage => ({
    title: "Auditoria do usuário",
    description: "Eventos de auditoria atribuídos a este usuário.",
    back: { href: `/users/${id}` as Route, label: "Usuário" },
  }),
} satisfies Record<string, PlannedPage | ((...params: string[]) => PlannedPage)>;
