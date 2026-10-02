"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { memo, useState, type Dispatch, type SetStateAction } from "react";
import { usePathname } from "next/navigation";
import { ease2 } from "@/shared/lib/animation";
import {
  isNavigationItemActive,
  navigationSections,
} from "../model/navigation";
import { UserAvatar } from "./UserAvatar";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onNavigate: () => void;
  setCollapsed: Dispatch<SetStateAction<boolean>>;
}

function NavTooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute top-1/2 left-[calc(100%+12px)] z-[70] hidden -translate-y-1/2 rounded-lg border border-border-strong bg-popover px-3 py-1.5 text-[12.5px] font-semibold whitespace-nowrap text-popover-foreground opacity-0 shadow-elevated transition group-hover:block group-hover:opacity-100 md:group-hover:block">
      {label}
      <span className="absolute top-1/2 -left-1 size-2 -translate-y-1/2 rotate-45 border-b border-l border-border-strong bg-popover" />
    </span>
  );
}

function SidebarComponent({
  collapsed,
  mobileOpen,
  onNavigate,
  setCollapsed,
}: SidebarProps) {
  const pathname = usePathname();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const desktopWidth = collapsed
    ? "md:w-16 md:min-w-16"
    : "md:w-[252px] md:min-w-[252px]";

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[60] flex w-[min(82vw,300px)] shrink-0 flex-col overflow-visible border-r border-border bg-background/95 shadow-[24px_0_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-[width,min-width,transform] duration-200 md:relative md:z-20 md:translate-x-0 md:shadow-none ${desktopWidth} ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <Link
        href="/"
        onClick={onNavigate}
        className="flex h-[60px] shrink-0 items-center gap-2.5 overflow-hidden border-b border-border px-4"
      >
        <motion.span whileHover={{ scale: 1.05 }} className="shrink-0">
          <Image
            src="/logo.png"
            alt="Iron Ledger"
            width={32}
            height={32}
            className="size-8 rounded-lg object-contain"
            priority
          />
        </motion.span>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18, ease: ease2 }}
              className="shrink-0 overflow-hidden"
            >
              <strong className="block text-[13.5px] leading-tight font-extrabold tracking-[-0.035em] whitespace-nowrap">
                Iron Ledger
              </strong>
              <small className="block text-[9px] font-bold tracking-[0.1em] whitespace-nowrap text-primary uppercase">
                Gestão operacional
              </small>
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      <nav
        aria-label="Navegação da aplicação"
        className="flex min-h-0 flex-1 flex-col overflow-x-visible overflow-y-auto px-2 py-2.5"
      >
        {navigationSections.map(([section, items], sectionIndex) => (
          <div key={section} className={sectionIndex ? "mt-3.5" : ""}>
            {!collapsed && (
              <p className="mb-1 px-3 text-[9.5px] font-bold tracking-[0.1em] text-subtle-foreground uppercase">
                {section}
              </p>
            )}
            {collapsed && sectionIndex > 0 && (
              <div className="mx-2 my-1.5 h-px bg-border" />
            )}
            <div className="flex flex-col gap-px">
              {items.map(({ icon: Icon, label, path, badge, shortcut }) => {
                const active = isNavigationItemActive(pathname, path);
                return (
                  <div
                    key={path}
                    className="group relative"
                    onMouseEnter={() => setHoveredPath(path)}
                    onMouseLeave={() => setHoveredPath(null)}
                  >
                    <Link
                      href={path}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      aria-label={label}
                      className={`relative flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13.5px] font-medium tracking-[-0.01em] transition-colors ${active ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-card-hover hover:text-foreground"}`}
                    >
                      <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                        <Icon size={16} strokeWidth={active ? 2.3 : 1.8} />
                        {badge && collapsed ? (
                          <span className="absolute top-0.5 right-0.5 flex size-3.5 items-center justify-center rounded-full border border-background bg-destructive text-[8px] font-extrabold text-white">
                            {badge}
                          </span>
                        ) : null}
                      </span>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="relative z-10 flex min-w-0 flex-1 items-center gap-1.5"
                        >
                          <span className="flex-1 whitespace-nowrap">
                            {label}
                          </span>
                          {badge ? (
                            <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[9.5px] font-extrabold text-white">
                              {badge}
                            </span>
                          ) : shortcut ? (
                            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[9.5px] font-normal text-subtle-foreground">
                              {shortcut}
                            </kbd>
                          ) : null}
                          {active && (
                            <span className="size-1 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                          )}
                        </motion.span>
                      )}
                    </Link>
                    {collapsed && hoveredPath === path && (
                      <NavTooltip label={label} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex shrink-0 flex-col gap-2 border-t border-border p-2">
        {!collapsed && (
          <div className="flex items-center gap-2.5 rounded-[10px] border border-border bg-card-elevated px-2.5 py-2">
            <UserAvatar className="size-[30px] text-[11px]" showStatus />
            <span className="min-w-0 flex-1 overflow-hidden">
              <strong className="block truncate text-xs font-bold tracking-[-0.02em]">
                admin@ironledger
              </strong>
              <small className="block text-[9.5px] font-bold tracking-[0.06em] text-primary uppercase">
                Super Admin
              </small>
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className="hidden w-full items-center justify-center rounded-[10px] border border-border py-2 text-subtle-foreground transition hover:border-border-strong hover:bg-card-hover hover:text-muted-foreground md:flex"
        >
          <ChevronRight
            size={14}
            className={`transition-transform ${collapsed ? "" : "rotate-180"}`}
          />
        </button>
      </div>
    </aside>
  );
}

export const Sidebar = memo(SidebarComponent);
