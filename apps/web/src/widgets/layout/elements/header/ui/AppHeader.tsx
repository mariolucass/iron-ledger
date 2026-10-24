"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, ChevronDown, Clock, Menu, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { unreadNotificationsCount } from "../api/mock-notifications";
import { firstNameOf, useCurrentUser } from "@/entities/user";
import { useClock } from "../model/use-clock";
import { Breadcrumbs } from "./Breadcrumbs";
import { NotificationDropdown } from "./NotificationDropdown";
import { UserAvatar } from "@/entities/user";
import { ThemeToggle } from "./ThemeToggle";
import { UserDropdown } from "./UserDropdown";

const control =
  "border border-ink/[0.08] bg-[linear-gradient(135deg,rgb(var(--ink-rgb)/5%),rgb(var(--ink-rgb)/2%))] text-[rgb(var(--ink-rgb)/70%)] shadow-[inset_0_1px_0_rgb(255_255_255/3%)] transition-[background,border-color,color,box-shadow] duration-[180ms] hover:border-ink/15 hover:bg-ink/[0.08] hover:text-foreground hover:shadow-[inset_0_1px_0_rgb(255_255_255/6%),0_2px_8px_rgb(0_0_0/10%)] aria-expanded:border-ink/15 aria-expanded:bg-ink/[0.08] aria-expanded:text-foreground aria-expanded:shadow-[inset_0_1px_0_rgb(255_255_255/6%),0_2px_8px_rgb(0_0_0/10%)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[rgb(0_229_160/70%)] motion-reduce:transition-none";

const CommandPalette = dynamic(
  () => import("@/features/platform/search-navigation").then((module) => module.CommandPalette),
  {
    ssr: false,
  },
);

export function AppHeader({ title, onMenuClick, mobileMenuOpen }: { title: string; onMenuClick: () => void; mobileMenuOpen: boolean }) {
  const clock = useClock();
  const { profile } = useCurrentUser();
  const reducedMotion = useReducedMotion();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((current) => !current);
      }
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <>
      <AnimatePresence>
        {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
      </AnimatePresence>
      <header className="isolate relative z-20 flex h-16 shrink-0 items-center gap-2 bg-[rgb(var(--surface-rgb))] px-4 shadow-[inset_0_1px_0_rgb(255_255_255/3%),0_8px_28px_rgb(0_0_0/10%)] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(ellipse_at_100%_0%,rgb(0_229_160/5%),transparent_45%),linear-gradient(115deg,rgb(var(--ink-rgb)/5%),transparent_55%)] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-[linear-gradient(90deg,rgb(var(--ink-rgb)/4%),rgb(var(--ink-rgb)/16%)_50%,rgb(var(--ink-rgb)/4%))] supports-[backdrop-filter:blur(24px)]:bg-[rgb(var(--surface-rgb)/72%)] supports-[backdrop-filter:blur(24px)]:backdrop-blur-[24px] supports-[backdrop-filter:blur(24px)]:backdrop-saturate-[1.4] md:h-[76px] md:gap-3 md:px-6 xl:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="app-navigation"
          className={`${control} flex size-10 shrink-0 items-center justify-center rounded-xl md:hidden`}
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0 shrink overflow-hidden pl-1 md:pl-0">
          <Breadcrumbs fallbackTitle={title} />
        </div>
        <div className="flex-1" />
        <div className="hidden items-center gap-1.5 text-[12.5px] tracking-[0.01em] text-ink/60 tabular-nums xl:flex">
          <Clock size={12} />
          {clock}
        </div>
        <div className="hidden shrink-0 items-center gap-2 rounded-full border border-ink/[0.06] bg-ink/[0.02] px-3 py-1.5 xl:flex">
          <span
            aria-hidden
            className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(0,229,160,0.7)]"
          />
          <strong className="text-[12px] font-medium tracking-[-0.005em] text-ink/80">
            Produção
          </strong>
          <span className="text-[11.5px] text-ink/50">v2.4.0</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setPaletteOpen(true);
            setNotificationsOpen(false);
            setUserOpen(false);
          }}
          aria-label="Pesquisar na aplicação"
          aria-haspopup="dialog"
          aria-expanded={paletteOpen}
          className={`${control} flex size-10 shrink-0 items-center justify-center gap-2 rounded-xl text-[12px] lg:w-52 lg:justify-start lg:px-3`}
        >
          <Search size={15} strokeWidth={1.65} />
          <span className="hidden flex-1 text-left text-[13px] tracking-[-0.01em] lg:block">
            Pesquisar...
          </span>
          <kbd className="hidden rounded-md border border-ink/[0.08] bg-black/[0.12] px-1.5 py-0.5 font-sans text-[11.5px] text-ink/55 shadow-[0_1px_0_rgb(var(--ink-rgb)/4%)] lg:block">
            ⌘K
          </kbd>
        </button>
        <ThemeToggle className={`${control} max-sm:hidden`} />
        <div className="hidden h-5 w-px shrink-0 bg-border sm:block" />
        <div className="relative">
          <motion.button
            type="button"
            whileHover={reducedMotion ? undefined : { scale: 1.025 }}
            whileTap={reducedMotion ? undefined : { scale: 0.96 }}
            onClick={() => {
              setNotificationsOpen((current) => !current);
              setUserOpen(false);
            }}
            aria-label="Notificações"
            aria-haspopup="dialog"
            aria-expanded={notificationsOpen}
            className={`${control} relative flex size-10 items-center justify-center rounded-xl`}
          >
            <Bell size={16} strokeWidth={1.65} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-[18px] items-center justify-center rounded-full border-2 border-[rgb(var(--surface-rgb))] bg-destructive text-[10px] font-bold text-white">
                {unreadNotificationsCount}
              </span>
            )}
          </motion.button>
          <AnimatePresence>
            {notificationsOpen && (
              <NotificationDropdown onClose={() => setNotificationsOpen(false)} />
            )}
          </AnimatePresence>
        </div>
        <div className="relative">
          <motion.button
            type="button"
            whileHover={reducedMotion ? undefined : { scale: 1.015 }}
            whileTap={reducedMotion ? undefined : { scale: 0.98 }}
            onClick={() => {
              setUserOpen((current) => !current);
              setNotificationsOpen(false);
            }}
            aria-label="Abrir menu do usuário"
            aria-haspopup="menu"
            aria-expanded={userOpen}
            className={`${control} flex h-10 items-center gap-2 rounded-full p-1 max-sm:size-10 max-sm:justify-center sm:pr-3`}
          >
            <UserAvatar className="size-8 text-[11.5px]" showStatus />
            <span className="hidden max-w-28 truncate text-[13px] font-medium tracking-[-0.01em] text-ink/85 sm:block">
              {firstNameOf(profile?.name)}
            </span>
            <ChevronDown
              size={11}
              aria-hidden
              className={`hidden text-ink/55 transition-transform duration-200 motion-reduce:transition-none sm:block ${userOpen ? "rotate-180" : ""}`}
            />
          </motion.button>
          <AnimatePresence>
            {userOpen && <UserDropdown onClose={() => setUserOpen(false)} />}
          </AnimatePresence>
        </div>
      </header>
    </>
  );
}
