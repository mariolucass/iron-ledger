import type { Route } from "next";

export interface PlannedPageLink {
  href: Route;
  label: string;
}

/** Conteúdo de uma rota planejada: o mesmo texto alimenta o metadata e a tela provisória. */
export interface PlannedPage {
  title: string;
  description: string;
  back?: PlannedPageLink;
  action?: PlannedPageLink;
}
