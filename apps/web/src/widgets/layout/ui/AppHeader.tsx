"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, ChevronDown, Clock, Menu, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { unreadNotificationsCount } from "../api/mock-notifications";
import { firstNameOf, useCurrentUser } from "../model/current-user";
import { useClock } from "../model/hooks";
import { Breadcrumbs } from "./Breadcrumbs";
import { NotificationDropdown } from "./NotificationDropdown";
import { UserAvatar } from "./UserAvatar";
import { UserDropdown } from "./UserDropdown";
import styles from "./AppHeader.module.css";

const CommandPalette = dynamic(() => import("./CommandPalette"), {
  ssr: false,
});

export function AppHeader({ title, onMenuClick }: { title: string; onMenuClick: () => void }) {
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
      <header
        className={`${styles.header} relative z-10 flex h-16 shrink-0 items-center gap-2 px-3.5 md:h-[76px] md:gap-3 md:px-6 xl:px-8`}
      >
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menu"
          className={`${styles.control} flex size-10 shrink-0 items-center justify-center rounded-xl md:hidden`}
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0 shrink overflow-hidden">
          <Breadcrumbs fallbackTitle={title} />
        </div>
        <div className="flex-1" />
        <div className="hidden items-center gap-1.5 text-[12.5px] tracking-[0.01em] text-white/60 tabular-nums xl:flex">
          <Clock size={12} />
          {clock}
        </div>
        <div
          className={`${styles.status} hidden shrink-0 items-center gap-2 rounded-full px-3 py-1.5 xl:flex`}
        >
          <span aria-hidden className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(0,229,160,0.7)]" />
          <strong className="text-[12px] font-medium tracking-[-0.005em] text-white/80">
            Produção
          </strong>
          <span className="text-[11.5px] text-white/50">v2.4.0</span>
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
          className={`${styles.control} flex size-10 shrink-0 items-center justify-center gap-2 rounded-xl text-[12px] lg:w-52 lg:justify-start lg:px-3`}
        >
          <Search size={15} strokeWidth={1.65} />
          <span className="hidden flex-1 text-left text-[13px] tracking-[-0.01em] lg:block">Pesquisar...</span>
          <kbd
            className={`${styles.shortcut} hidden rounded-md px-1.5 py-0.5 font-sans text-[11.5px] lg:block`}
          >
            ⌘K
          </kbd>
        </button>
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
            className={`${styles.control} relative flex size-10 items-center justify-center rounded-xl`}
          >
            <Bell size={16} strokeWidth={1.65} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-[18px] items-center justify-center rounded-full border-2 border-[#1b1e20] bg-destructive text-[10px] font-bold text-white">
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
            className={`${styles.control} flex h-10 items-center gap-2 rounded-full p-1 sm:pr-3`}
          >
            <UserAvatar className="size-8 text-[11.5px]" showStatus />
            <span className="hidden max-w-28 truncate text-[13px] font-medium tracking-[-0.01em] text-white/85 sm:block">
              {firstNameOf(profile?.name)}
            </span>
            <ChevronDown
              size={11}
              aria-hidden
              className={`hidden text-white/55 transition-transform duration-200 motion-reduce:transition-none sm:block ${userOpen ? "rotate-180" : ""}`}
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
