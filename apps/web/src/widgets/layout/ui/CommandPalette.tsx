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
      className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/65 pt-[14vh] backdrop-blur-[10px]"
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
        className="mx-5 w-full max-w-[560px] overflow-hidden rounded-[18px] border border-border-strong bg-[#111] shadow-[0_40px_100px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)]"
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search size={16} className="shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar páginas, ações..."
            className="w-full bg-transparent text-[15px] tracking-[-0.01em] text-foreground outline-none placeholder:text-subtle-foreground"
          />
          <kbd className="shrink-0 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] text-subtle-foreground">
            ESC
          </kbd>
        </div>
        <div className="max-h-[380px] overflow-y-auto p-2">
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
              <div className="mx-1 my-2 h-px bg-border" />
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
            <div className="px-6 py-8 text-center text-[13px] text-subtle-foreground">
              <Search size={28} className="mx-auto mb-3 opacity-30" />
              Nenhum resultado para “
              <strong className="text-muted-foreground">{query}</strong>”
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 border-t border-border bg-black/20 px-5 py-2.5">
          {[
            ["↑↓", "Navegar"],
            ["↵", "Selecionar"],
            ["ESC", "Fechar"],
          ].map(([key, hint]) => (
            <span
              key={key}
              className="flex items-center gap-1.5 text-[11px] text-subtle-foreground"
            >
              <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px]">
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
    <h3 className="px-2.5 pt-1 pb-1.5 text-[9.5px] font-bold tracking-[0.1em] text-subtle-foreground uppercase">
      {children}
    </h3>
  );
}

function PaletteItem({
  active,
  focused,
  item,
  onFocus,
  onSelect,
  suffix,
}: {
  active: boolean;
  focused: boolean;
  item: NavigationItem;
  onFocus?: () => void;
  onSelect: () => void;
  suffix?: string;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onFocus}
      className={`mb-px flex w-full items-center gap-3 rounded-[10px] border px-2.5 py-2 text-left text-[13.5px] tracking-[-0.01em] transition ${focused ? "border-border-strong bg-card-hover text-foreground" : "border-transparent text-muted-foreground hover:bg-card"}`}
    >
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-lg border ${active ? "border-primary/30 bg-primary-soft text-primary" : "border-border bg-card"}`}
      >
        <Icon size={13} />
      </span>
      <span className={`flex-1 ${active ? "text-primary" : ""}`}>
        {item.label}
      </span>
      {suffix ? (
        <span className="text-[10px] text-subtle-foreground">{suffix}</span>
      ) : item.shortcut ? (
        <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] text-subtle-foreground">
          {item.shortcut}
        </kbd>
      ) : null}
      {focused && (
        <span className="ml-1 text-[10px] text-subtle-foreground">↵</span>
      )}
    </button>
  );
}
