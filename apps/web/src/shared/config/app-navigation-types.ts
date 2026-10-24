import type { LucideIcon } from "lucide-react";
import type { Route } from "next";

export type NavigationShortcut = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

export interface NavigationItem {
  badge?: number;
  icon: LucideIcon;
  label: string;
  path: Route;
  section: string;
  /** Atribuído pela posição: os nove primeiros destinos da barra lateral recebem 1–9. */
  shortcut?: NavigationShortcut;
  children?: NavigationChild[];
  /** Páginas de um registro, exibidas somente quando a rota atual identifica esse registro. */
  records?: NavigationRecord[];
}

/** Item como é declarado: seção e atalho são derivados da posição na configuração. */
export type NavigationItemConfig = Omit<NavigationItem, "section" | "shortcut">;

export interface NavigationSectionConfig {
  label: string;
  items: NavigationItemConfig[];
}

export interface NavigationChild {
  label: string;
  path: Route;
  /** Links para o registro identificado na URL atual. */
  contextual?: boolean;
}

export interface NavigationRecord {
  /** Rota do registro com segmentos dinâmicos entre colchetes, como `/warehouses/[id]`. */
  pattern: `/${string}`;
  pages: NavigationRecordPage[];
}

export interface NavigationRecordPage {
  label: string;
  /** Caminho relativo à rota do registro; omitido, aponta para o próprio registro. */
  suffix?: `/${string}`;
}
