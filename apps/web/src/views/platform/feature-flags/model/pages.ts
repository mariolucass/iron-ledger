import type { PlannedPage } from "@/shared/config/planned-page";

/** Feature flags e regras de liberação (platform.FeatureFlag). */
export const featureFlagPages = {
  list: {
    title: "Feature flags",
    description: "Funcionalidades liberadas, percentual de rollout e regras de segmentação.",
    back: { href: "/system", label: "Plataforma" },
    action: { href: "/system/feature-flags/new", label: "Nova feature flag" },
  },
  create: {
    title: "Nova feature flag",
    description: "Defina chave, descrição, percentual de rollout e regras.",
    back: { href: "/system/feature-flags", label: "Feature flags" },
  },
  detail: {
    title: "Feature flag",
    description: "Situação, rollout e regras da flag.",
    back: { href: "/system/feature-flags", label: "Feature flags" },
  },
} satisfies Record<string, PlannedPage>;
