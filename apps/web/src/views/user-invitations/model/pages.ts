import type { PlannedPage } from "@/shared/config/planned-page";

/** Convites pendentes (identity.VerificationToken com finalidade INVITATION). */
export const userInvitationPages = {
  list: {
    title: "Convites",
    description: "Convites enviados, pendentes, aceitos e expirados.",
    back: { href: "/users", label: "Usuários" },
    action: { href: "/users/new", label: "Convidar usuário" },
  },
} satisfies Record<string, PlannedPage>;
