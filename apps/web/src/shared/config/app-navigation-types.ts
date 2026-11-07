import type { LucideIcon } from "lucide-react";
import type { Route } from "next";

export type NavigationShortcut = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

export interface NavigationItem {
  /** Contador dinâmico exibido ao lado do item; o valor vem do shell. */
  badge?: "alerts";
  icon: LucideIcon;
  label: string;
  path: Route;
  section: string;
  /** Ctrl/⌘+⇧+dígito; declarado no item para não mudar quando a ordem da barra lateral muda. */
  shortcut?: NavigationShortcut;
  children?: NavigationChild[];
  /** Páginas de um registro, exibidas somente quando a rota atual identifica esse registro. */
  records?: NavigationRecord[];
  /** Rotas do módulo fora da barra lateral; dão rótulo à trilha de navegação. */
  hidden?: NavigationHiddenRoute[];
}

/** Item como é declarado: a seção é derivada da posição na configuração. */
export type NavigationItemConfig = Omit<NavigationItem, "section">;

export interface NavigationSectionConfig {
  label: string;
  items: NavigationItemConfig[];
}

export interface NavigationChild {
  label: string;
  path: Route;
  /** Registro identificado na URL atual ao qual a página pertence. */
  record?: NavigationRecordMatch;
}

export interface NavigationRecord {
  /** Rota do registro com segmentos dinâmicos entre colchetes, como `/warehouses/[id]`. */
  pattern: `/${string}`;
  /** Tipo do registro, como "Armazém": rótulo da trilha e da barra lateral enquanto o nome não carrega. */
  label: string;
  pages: NavigationRecordPage[];
}

export interface NavigationRecordMatch {
  pattern: `/${string}`;
  label: string;
  /** Rota do registro na URL atual, como `/warehouses/<uuid>`. */
  path: Route;
  /** Valores dos segmentos dinâmicos, na ordem do padrão. */
  params: string[];
  pages: NavigationRecordPage[];
}

export interface NavigationRecordPage {
  label: string;
  /** Caminho relativo à rota do registro; omitido, aponta para o próprio registro. */
  suffix?: `/${string}`;
}

export interface NavigationHiddenRoute {
  label: string;
  /** Rota com segmentos dinâmicos entre colchetes, como `/analytics/inflection-points/[slug]`. */
  pattern: `/${string}`;
  /** `false` para segmentos que agrupam rotas sem página própria: a trilha os mostra sem link. */
  page?: false;
}

/** Rota declarada em qualquer parte da navegação, com o rótulo que a trilha exibe. */
export interface NavigationRoute {
  label: string;
  pattern: string;
  page: boolean;
}
