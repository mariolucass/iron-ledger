import type { Route } from "next";

export type LandingIcon =
  | "activity"
  | "boxes"
  | "check"
  | "database"
  | "git-branch"
  | "globe"
  | "package"
  | "shield"
  | "trending-up"
  | "users"
  | "warehouse"
  | "zap";

export type LandingTone = "blue" | "emerald" | "orange" | "primary" | "purple" | "red" | "yellow";

export interface LandingNavLink {
  href: `#${string}`;
  label: string;
}

/** Cartão do mosaico de recursos; `span` é a largura em colunas de uma grade de 6. */
export interface LandingFeature {
  description: string;
  icon: LandingIcon;
  /** Trecho curto que ilustra o recurso (ex.: um diff, um caminho). */
  sample?: string;
  span: 2 | 3 | 4;
  title: string;
  tone: LandingTone;
}

export interface LandingStep {
  description: string;
  title: string;
}

export interface LandingFlowNode {
  detail: string;
  icon: LandingIcon;
  title: string;
  tone: LandingTone;
}

export interface LandingFooterLink {
  label: string;
  /** Sem `href` a página ainda não existe: o rodapé mostra o item como "Em breve". */
  href?: Route;
}

export interface LandingLinkGroup {
  links: LandingFooterLink[];
  title: string;
}
