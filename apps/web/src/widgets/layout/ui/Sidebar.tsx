"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { memo, useId, type Dispatch, type SetStateAction } from "react";
import { usePathname } from "next/navigation";
import { ease2 } from "@/shared/lib/animation";
import { firstNameOf, roleLabelOf, useCurrentUser } from "../model/current-user";
import { isNavigationItemActive, navigationSections } from "../model/navigation";
import { UserAvatar } from "./UserAvatar";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onNavigate: () => void;
  setCollapsed: Dispatch<SetStateAction<boolean>>;
}

function SidebarComponent({ collapsed, mobileOpen, onNavigate, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const selectionId = useId();
  const { profile } = useCurrentUser();
  const compact = collapsed && !mobileOpen;
  const desktopWidth = collapsed ? "md:w-16 md:min-w-16" : "md:w-[252px] md:min-w-[252px]";

  return (
    <aside
      className={`${styles.panel} fixed inset-y-0 left-0 z-[60] flex w-[min(82vw,300px)] shrink-0 flex-col overflow-visible transition-[width,min-width,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:relative md:z-20 md:translate-x-0 ${desktopWidth} ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <Link
        href="/"
        onClick={onNavigate}
        className={`${styles.brand} flex h-[76px] shrink-0 items-center gap-3 overflow-hidden px-4`}
      >
        <motion.span whileHover={{ scale: 1.05 }} className="shrink-0">
          <Image
            src="/brand/logo-symbol-dark.svg"
            alt="Iron Ledger"
            width={32}
            height={32}
            className="size-8 rounded-lg object-contain"
            priority
          />
        </motion.span>
        <AnimatePresence initial={false}>
          {!compact && (
            <motion.span
              initial={reducedMotion ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reducedMotion ? 0 : -8 }}
              transition={{ duration: 0.18, ease: ease2 }}
              className="shrink-0 overflow-hidden"
            >
              <strong className="block text-[14px] leading-tight font-semibold tracking-[-0.035em] whitespace-nowrap">
                Iron Ledger
              </strong>
              <small className="mt-0.5 block text-[12px] font-medium tracking-[-0.005em] whitespace-nowrap text-white/60">
                Gestão operacional
              </small>
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      <LayoutGroup id={selectionId}>
        <motion.nav
          layoutScroll
          aria-label="Navegação da aplicação"
          className={`${styles.navigation} flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-2 py-3`}
        >
          {navigationSections.map(([section, items], sectionIndex) => (
            <div key={section} className={sectionIndex ? "mt-5" : ""}>
              {!compact && (
                <p className="mb-2 px-3 text-[12px] font-semibold tracking-[-0.005em] text-white/55">
                  {section}
                </p>
              )}
              {compact && sectionIndex > 0 && <div className="mx-2 my-1.5 h-px bg-border" />}
              <div className="flex flex-col gap-1">
                {items.map(({ icon: Icon, label, path, badge, shortcut }) => {
                  const active = isNavigationItemActive(pathname, path);
                  return (
                    <div key={path} className="group relative">
                      <Link
                        href={path}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        aria-label={label}
                        title={compact ? label : undefined}
                        className={`${styles.item} ${active ? styles.active : ""} relative flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[13.5px] font-medium tracking-[-0.015em]`}
                      >
                        {active && (
                          <motion.span
                            aria-hidden="true"
                            layoutId="sidebar-selection"
                            initial={false}
                            transition={
                              reducedMotion
                                ? { duration: 0 }
                                : { type: "spring", stiffness: 420, damping: 38 }
                            }
                            className={styles.selection}
                          />
                        )}
                        <span
                          className={`${styles.icon} relative z-10 flex size-7 shrink-0 items-center justify-center rounded-[9px]`}
                        >
                          <Icon size={16} strokeWidth={active ? 1.9 : 1.65} />
                          {badge && compact ? (
                            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-[#171a1c] bg-destructive text-[10px] font-bold text-white">
                              {badge}
                            </span>
                          ) : null}
                        </span>
                        {!compact && (
                          <motion.span
                            initial={false}
                            animate={{ opacity: 1, x: 0 }}
                            className="relative z-10 flex min-w-0 flex-1 items-center gap-1.5"
                          >
                            <span className="flex-1 whitespace-nowrap">{label}</span>
                            {badge ? (
                              <span className="rounded-full bg-destructive px-1.5 py-px text-[11px] font-bold text-white">
                                {badge}
                              </span>
                            ) : shortcut ? (
                              <kbd className="px-1 py-0.5 font-sans text-[11px] font-normal tracking-normal text-white/50">
                                {shortcut}
                              </kbd>
                            ) : null}
                            {active && (
                              <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_10px_rgba(0,229,160,0.7)]" />
                            )}
                          </motion.span>
                        )}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.nav>
      </LayoutGroup>

      <div className={`${styles.footer} flex shrink-0 flex-col gap-2 p-2`}>
        {!compact && (
          <div className={`${styles.account} flex items-center gap-2.5 rounded-xl px-2.5 py-3`}>
            <UserAvatar className="size-[30px] text-[11px]" showStatus />
            <span className="min-w-0 flex-1 overflow-hidden">
              <strong className="block truncate text-[13px] font-semibold tracking-[-0.015em]" title={profile?.email}>
                {profile ? firstNameOf(profile.name) : "Conta"}
              </strong>
              <small className="mt-0.5 block truncate text-[12px] font-normal text-white/60">
                {profile ? roleLabelOf(profile.roles) : "Carregando…"}
              </small>
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          aria-expanded={!collapsed}
          className={`${styles.collapse} hidden w-full items-center justify-center gap-2 rounded-xl py-2.5 text-white/60 transition hover:bg-white/[0.06] hover:text-white/90 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 md:flex`}
        >
          <ChevronRight
            size={14}
            aria-hidden
            className={`transition-transform motion-reduce:transition-none ${collapsed ? "" : "rotate-180"}`}
          />
          {!compact && <span className="text-[12px] font-medium">Recolher menu</span>}
        </button>
      </div>
    </aside>
  );
}

export const Sidebar = memo(SidebarComponent);
