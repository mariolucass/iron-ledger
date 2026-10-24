import type { PlannedPage } from "@/shared/config/planned-page";

/** Parâmetros do sistema (platform.Setting com escopo SYSTEM). */
export const systemSettingPages = {
  list: {
    title: "Parâmetros do sistema",
    description: "Configurações globais, por armazém e por usuário, com valores sensíveis ocultos.",
    back: { href: "/system", label: "Plataforma" },
  },
} satisfies Record<string, PlannedPage>;
