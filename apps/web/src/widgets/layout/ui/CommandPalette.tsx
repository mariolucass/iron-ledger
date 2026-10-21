"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import type { Route } from "next";
import { useRouter, usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ease2 } from "@/shared/lib/animation";
import { isNavigationItemActive, navigationItems } from "../model/navigation";
import { glassPanel } from "./glass";
import { useRecentPages } from "../model/hooks";
import type { NavigationItem } from "../model/types";

function groupItems(items: NavigationItem[]) {
  return Object.entries(
    items.reduce<Record<string, NavigationItem[]>>((groups, item) => {
      (groups[item.section] ??= []).push(item);
      return groups;
    }, {}),
  );
}

export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const recentPages = useRecentPages();
  const [query, setQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    return term
      ? navigationItems.filter((item) =>
          item.label.toLocaleLowerCase("pt-BR").includes(term),
        )
      : navigationItems;
  }, [query]);
  const groupedResults = useMemo(() => groupItems(results), [results]);
  const recentResults = useMemo(
    () => recentPages.filter((item) => item.path !== pathname).slice(0, 3),
    [pathname, recentPages],
  );

  useEffect(() => {
    inputRef.current?.focus();
    const onEscape = (event: globalThis.KeyboardEvent) =>
      event.key === "Escape" && onClose();
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [onClose]);

  useEffect(() => setFocusedIndex(0), [query]);

  useEffect(() => {
    document.getElementById(`palette-option-${focusedIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex]);

  const navigate = (path: Route) => {
    router.push(path);
    onClose();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusedIndex((current) => Math.min(current + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusedIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && results[focusedIndex]) {
      navigate(results[focusedIndex].path);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/55 pt-[14vh] backdrop-blur-md"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Pesquisar na aplicação"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: ease2 }}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
        className={`mx-5 w-full max-w-[580px] overflow-hidden rounded-[28px] ${glassPanel} shadow-[0_40px_100px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)]`}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4">
          <Search size={18} aria-hidden className="shrink-0 text-white/60" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar páginas, ações..."
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-listbox"
            aria-activedescendant={results.length ? `palette-option-${focusedIndex}` : undefined}
            aria-autocomplete="list"
            className="w-full bg-transparent text-[17px] tracking-[-0.015em] text-foreground outline-none placeholder:text-white/45"
          />
          <kbd className="shrink-0 rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-sans text-[11.5px] text-white/55">
            ESC
          </kbd>
        </div>
        <div id="palette-listbox" role="listbox" aria-label="Resultados" className="max-h-[400px] overflow-y-auto p-2">
          {!query && recentResults.length > 0 && (
            <div className="mb-2">
              <PaletteGroupLabel>Recente</PaletteGroupLabel>
              {recentResults.map((item) => (
                <PaletteItem
                  key={`recent-${item.path}`}
                  item={item}
                  active={false}
                  focused={false}
                  suffix="Recente"
                  onSelect={() => navigate(item.path)}
                />
              ))}
              <div className="mx-1 my-2 h-px bg-white/[0.08]" />
            </div>
          )}
          {groupedResults.map(([section, items]) => (
            <div key={section} className="mb-1">
              <PaletteGroupLabel>{section}</PaletteGroupLabel>
              {items.map((item) => {
                const index = results.findIndex(
                  ({ path }) => path === item.path,
                );
                return (
                  <PaletteItem
                    key={item.path}
                    item={item}
                    index={index}
                    active={isNavigationItemActive(pathname, item.path)}
                    focused={index === focusedIndex}
                    onFocus={() => setFocusedIndex(index)}
                    onSelect={() => navigate(item.path)}
                  />
                );
              })}
            </div>
          ))}
          {!results.length && (
            <div role="status" className="px-6 py-10 text-center text-[14px] text-white/60">
              <Search size={28} aria-hidden className="mx-auto mb-3 opacity-40" />
              Nenhum resultado para “
              <strong className="text-foreground">{query}</strong>”
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 border-t border-white/[0.08] bg-black/20 px-5 py-3">
          {[
            ["↑↓", "Navegar"],
            ["↵", "Selecionar"],
            ["ESC", "Fechar"],
          ].map(([key, hint]) => (
            <span
              key={key}
              className="flex items-center gap-1.5 text-[12px] text-white/55"
            >
              <kbd className="rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-sans text-[11.5px]">
                {key}
              </kbd>
              {hint}
            </span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function PaletteGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-3 pt-1.5 pb-1.5 text-[12px] font-semibold tracking-[-0.005em] text-white/55">
      {children}
    </h3>
  );
}

function PaletteItem({
  active,
  focused,
  index,
  item,
  onFocus,
  onSelect,
  suffix,
}: {
  active: boolean;
  focused: boolean;
  /** Posição na lista de resultados; ausente nos itens "Recentes", que não participam da seleção por setas. */
  index?: number;
  item: NavigationItem;
  onFocus?: () => void;
  onSelect: () => void;
  suffix?: string;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      id={index === undefined ? undefined : `palette-option-${index}`}
      role="option"
      aria-selected={focused}
      tabIndex={-1}
      onClick={onSelect}
      onMouseEnter={onFocus}
      className={`mb-px flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left text-[14.5px] tracking-[-0.01em] transition-colors motion-reduce:transition-none ${focused ? "border-white/[0.12] bg-white/[0.08] text-foreground" : "border-transparent text-white/70 hover:bg-white/[0.04]"}`}
    >
      <span
        aria-hidden
        className={`flex size-8 shrink-0 items-center justify-center rounded-xl border ${active ? "border-primary/30 bg-primary-soft text-primary" : "border-white/10 bg-white/[0.04]"}`}
      >
        <Icon size={15} />
      </span>
      <span className={`flex-1 ${active ? "text-primary" : ""}`}>{item.label}</span>
      {suffix ? (
        <span className="text-[12px] text-white/50">{suffix}</span>
      ) : item.shortcut ? (
        <kbd className="rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-sans text-[11.5px] text-white/55">
          {item.shortcut}
        </kbd>
      ) : null}
      {focused && <span aria-hidden className="ml-1 text-[12px] text-white/50">↵</span>}
    </button>
  );
}
