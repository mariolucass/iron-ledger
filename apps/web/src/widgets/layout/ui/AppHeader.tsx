"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronDown, Clock, Menu, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { unreadNotificationsCount } from "../api/mock-notifications";
import { useClock } from "../model/hooks";
import { Breadcrumbs } from "./Breadcrumbs";
import { NotificationDropdown } from "./NotificationDropdown";
import { UserAvatar } from "./UserAvatar";
import { UserDropdown } from "./UserDropdown";

const CommandPalette = dynamic(() => import("./CommandPalette"), {
  ssr: false,
});

export function AppHeader({
  title,
  onMenuClick,
}: {
  title: string;
  onMenuClick: () => void;
}) {
  const clock = useClock();
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
        {paletteOpen && (
          <CommandPalette onClose={() => setPaletteOpen(false)} />
        )}
      </AnimatePresence>
      <header className="relative z-10 flex h-14 shrink-0 items-center gap-2.5 border-b border-border bg-background/90 px-3.5 backdrop-blur-2xl md:h-[58px] md:gap-4 md:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menu"
          className="flex size-[38px] shrink-0 items-center justify-center rounded-[10px] border border-border bg-card text-muted-foreground md:hidden"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0 shrink overflow-hidden">
          <Breadcrumbs fallbackTitle={title} />
        </div>
        <div className="flex-1" />
        <div className="hidden items-center gap-1.5 text-xs tracking-[0.02em] text-subtle-foreground tabular-nums xl:flex">
          <Clock size={12} />
          {clock}
        </div>
        <div className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 xl:flex">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
          <strong className="text-[10.5px] tracking-[0.04em] text-muted-foreground">
            PRODUÇÃO
          </strong>
          <span className="text-[10px] text-subtle-foreground">v2.4.0</span>
        </div>
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="hidden min-w-45 items-center gap-2 rounded-[10px] border border-border bg-card px-3 py-2 text-[13px] text-subtle-foreground transition hover:border-border-strong hover:text-muted-foreground lg:flex"
        >
          <Search size={13} />
          <span className="flex-1 text-left tracking-[-0.01em]">
            Pesquisar...
          </span>
          <kbd className="rounded border border-border bg-card-elevated px-1.5 py-0.5 text-[10px]">
            ⌘K
          </kbd>
        </button>
        <div className="hidden h-5 w-px shrink-0 bg-border sm:block" />
        <div className="relative">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setNotificationsOpen((current) => !current);
              setUserOpen(false);
            }}
            aria-label="Notificações"
            aria-expanded={notificationsOpen}
            className={`relative flex size-9 items-center justify-center rounded-[10px] border text-muted-foreground transition ${notificationsOpen ? "border-border-strong bg-card-elevated" : "border-border bg-card"}`}
          >
            <Bell size={15} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full border-2 border-background bg-destructive text-[8px] font-extrabold text-white">
                {unreadNotificationsCount}
              </span>
            )}
          </motion.button>
          <AnimatePresence>
            {notificationsOpen && (
              <NotificationDropdown
                onClose={() => setNotificationsOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>
        <div className="relative">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setUserOpen((current) => !current);
              setNotificationsOpen(false);
            }}
            aria-label="Abrir menu do usuário"
            aria-expanded={userOpen}
            className={`flex items-center gap-2 rounded-full border p-1 sm:pr-2.5 ${userOpen ? "border-border-strong bg-card-elevated" : "border-border bg-card"}`}
          >
            <UserAvatar className="size-7 text-[10.5px]" showStatus />
            <span className="hidden text-[12.5px] font-semibold tracking-[-0.01em] text-muted-foreground sm:block">
              Admin
            </span>
            <ChevronDown
              size={11}
              className={`hidden text-subtle-foreground transition-transform sm:block ${userOpen ? "rotate-180" : ""}`}
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
