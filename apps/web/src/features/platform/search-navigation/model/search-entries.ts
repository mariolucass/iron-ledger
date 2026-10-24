import { Plus, Upload, type LucideIcon } from "lucide-react";
import type { Route } from "next";
import { navigationItems, navigationRecordMatches } from "@/shared/config/app-navigation";
import type { NavigationShortcut } from "@/shared/config/app-navigation-types";

export interface SearchEntry {
  label: string;
  path: Route;
  /** Grupo do resultado: a seção da barra lateral, "Ações" ou o registro aberto. */
  group: string;
  icon: LucideIcon;
  /** Módulo da página, exibido ao lado do rótulo e considerado na busca ("Categorias · Produtos"). */
  context?: string;
  shortcut?: NavigationShortcut;
}

export const ACTIONS_GROUP = "Ações";

const actionIcon = (path: string, fallback: LucideIcon) =>
  path.endsWith("/new") ? Plus : path.endsWith("/import") ? Upload : fallback;

/** Destinos fixos: itens e subpáginas da barra lateral, mais as ações declaradas em `hidden`. */
export const searchEntries: SearchEntry[] = navigationItems.flatMap((item) => [
  { label: item.label, path: item.path, group: item.section, icon: item.icon, shortcut: item.shortcut },
  ...(item.children ?? [])
    .filter(({ path }) => path !== item.path)
    .map(({ label, path }) => ({ label, path, group: item.section, icon: item.icon, context: item.label })),
  ...(item.hidden ?? [])
    .filter(({ pattern, page }) => page !== false && !pattern.includes("["))
    .map(({ label, pattern }) => ({
      label,
      path: pattern as Route,
      group: ACTIONS_GROUP,
      icon: actionIcon(pattern, item.icon),
      context: item.label,
    })),
]);

/** Páginas dos registros identificados em `pathname`, agrupadas pelo tipo ("Neste armazém"). */
export function recordSearchEntries(pathname: string): SearchEntry[] {
  return navigationRecordMatches(pathname).flatMap((record) => {
    const item = navigationItems.find(({ records }) => records?.some(({ pattern }) => pattern === record.pattern));
    return record.pages.map(({ label, suffix = "" }) => ({
      label,
      path: `${record.path}${suffix}` as Route,
      group: `Neste registro · ${record.label}`,
      icon: item?.icon ?? Plus,
      context: record.label,
    }));
  });
}

/** Minúsculas sem acentos: "transacao" encontra "Transação". */
const normalize = (text: string) =>
  text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR");

const tokens = (text: string) => normalize(text).split(/\s+/).filter(Boolean);

const commonPrefix = (a: string, b: string) => {
  let length = 0;
  while (length < a.length && a[length] === b[length]) length += 1;
  return length;
};

/** O termo contém a palavra ou difere só no final, como singular e plural ("transacao" → "transacoes"). */
const matches = (word: string, token: string) =>
  token.includes(word) || commonPrefix(word, token) >= Math.max(4, word.length - 2);

/** Relevância de `entry` para `words` (menor é melhor); `undefined` quando alguma palavra não aparece. */
function score(entry: SearchEntry, words: string[]): number | undefined {
  const label = tokens(entry.label);
  const all = [...label, ...tokens(entry.context ?? "")];
  if (!words.every((word) => all.some((token) => matches(word, token)))) return undefined;
  const phrase = words.join(" ");
  const text = label.join(" ");
  if (text === phrase) return 0;
  if (text.startsWith(phrase)) return 1;
  if (!words.every((word) => label.some((token) => matches(word, token)))) return 4;
  return matches(words[0]!, label[0]!) ? 2 : 3;
}

/** Resultados ordenados por relevância; empates mantêm a ordem da barra lateral. */
export function searchNavigation(entries: SearchEntry[], query: string): SearchEntry[] {
  const words = tokens(query);
  if (!words.length) return entries;
  return entries
    .map((entry, index) => ({ entry, index, rank: score(entry, words) }))
    .filter((result): result is typeof result & { rank: number } => result.rank !== undefined)
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ entry }) => entry);
}

/** Agrupa mantendo a ordem: o grupo do melhor resultado vem primeiro. */
export function groupSearchEntries(entries: SearchEntry[]): [string, SearchEntry[]][] {
  const groups = new Map<string, SearchEntry[]>();
  for (const entry of entries) {
    const group = groups.get(entry.group) ?? [];
    group.push(entry);
    groups.set(entry.group, group);
  }
  return [...groups];
}
