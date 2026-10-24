"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  memo,
  useEffect,
  useId,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { usePathname } from "next/navigation";
import { ease2 } from "@/shared/lib/animation";
import { firstNameOf, roleLabelOf, useCurrentUser } from "@/entities/user";
import { isNavigationItemActive, navigationChildren, navigationSections } from "@/shared/config/app-navigation";
import { UserAvatar } from "@/entities/user";
import styles from "./Sidebar.module.css";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[rgb(0_229_160/70%)]";
const item = `border border-transparent text-[rgb(var(--ink-rgb)/88%)] transition-[background,border-color,color,box-shadow] duration-[160ms] hover:bg-ink/[0.05] hover:text-foreground motion-reduce:transition-none ${focus}`;

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
  const activeSection = navigationSections.find(([, items]) =>
    items.some((item) => isNavigationItemActive(pathname, item.path)),
  )?.[0];
  const [openSection, setOpenSection] = useState<string | null>(
    activeSection ?? navigationSections[0]?.[0] ?? null,
  );
  const [openItem, setOpenItem] = useState<string | null>(
    navigationSections.flatMap(([, items]) => items).find((item) =>
      item.children?.length && isNavigationItemActive(pathname, item.path),
    )?.path ?? null,
  );
  const previousActiveSection = useRef(activeSection);
  const previousPathname = useRef(pathname);
  const { profile } = useCurrentUser();
  const compact = collapsed && !mobileOpen;
  const desktopWidth = collapsed ? "md:w-16 md:min-w-16" : "md:w-[268px] md:min-w-[268px]";

  useEffect(() => {
    if (activeSection !== previousActiveSection.current) {
      previousActiveSection.current = activeSection;
      if (activeSection) setOpenSection(activeSection);
    }
  }, [activeSection]);

  useEffect(() => {
    if (pathname === previousPathname.current) return;
    previousPathname.current = pathname;
    const current = navigationSections.flatMap(([, items]) => items).find((item) =>
      item.children?.length && isNavigationItemActive(pathname, item.path),
    );
    if (current) setOpenItem(current.path);
  }, [pathname]);

  return (
    <aside
      id="app-navigation"
      data-mobile-open={mobileOpen}
      className={`${styles.drawer} isolate fixed inset-y-0 left-0 z-[60] flex w-[min(82vw,300px)] shrink-0 flex-col overflow-visible border-r border-ink/10 bg-[rgb(var(--surface-rgb))] text-foreground shadow-[inset_-1px_0_0_rgb(var(--ink-rgb)/3%),12px_0_40px_rgb(0_0_0/18%)] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(ellipse_at_0%_0%,rgb(var(--ink-rgb)/7%),transparent_50%),radial-gradient(ellipse_at_100%_85%,rgb(0_229_160/5%),transparent_55%),radial-gradient(ellipse_at_0%_100%,rgb(167_139_250/5%),transparent_55%),linear-gradient(160deg,rgb(var(--ink-rgb)/3%),transparent_45%)] supports-[backdrop-filter:blur(24px)]:bg-[rgb(var(--surface-rgb)/78%)] supports-[backdrop-filter:blur(24px)]:backdrop-blur-[24px] supports-[backdrop-filter:blur(24px)]:backdrop-saturate-[1.4] transition-[width,min-width,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:relative md:z-20 ${desktopWidth}`}
    >
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className={`flex h-[76px] shrink-0 items-center gap-3 overflow-hidden border-b border-ink/[0.06] px-4 ${focus}`}
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
              <strong className="block text-[16px] leading-tight font-semibold tracking-[-0.035em] whitespace-nowrap">
                Iron Ledger
              </strong>
              <small className="mt-0.5 block text-[13px] font-medium tracking-[-0.005em] whitespace-nowrap text-ink/75">
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
          className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-2 py-3 [scrollbar-color:rgb(var(--ink-rgb)/12%)_transparent] [scrollbar-width:thin]"
        >
          {navigationSections.map(([section, items], sectionIndex) => {
            const open = openSection === section;
            const visible = compact || open;
            const sectionActive = items.some((item) => isNavigationItemActive(pathname, item.path));
            const contentId = `${selectionId}-section-${sectionIndex}`;
            return (
              <div key={section} className={sectionIndex ? "mt-3" : ""}>
                {!compact && (
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={contentId}
                    onClick={() =>
                      setOpenSection((current) => (current === section ? null : section))
                    }
                    className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13.5px] font-semibold tracking-[-0.005em] text-[rgb(var(--ink-rgb)/76%)] transition-[color,background,box-shadow] duration-[160ms] hover:bg-ink/[0.05] hover:text-foreground motion-reduce:transition-none ${focus} ${sectionActive ? "isolate relative overflow-hidden bg-ink/[0.06] text-foreground shadow-[inset_0_0_0_1px_rgb(var(--ink-rgb)/9%),inset_0_1px_0_rgb(255_255_255/10%),0_2px_10px_rgb(0_0_0/16%)] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(circle_at_10%_15%,rgb(129_140_248/34%),transparent_55%),radial-gradient(circle_at_90%_95%,rgb(56_189_248/22%),transparent_55%),radial-gradient(circle_at_65%_0%,rgb(192_132_252/20%),transparent_50%)] before:blur-md hover:bg-ink/[0.09]" : ""}`}
                  >
                    <span>
                      {section}
                      {sectionActive && <span className="sr-only"> — categoria atual</span>}
                    </span>
                    <motion.span
                      aria-hidden="true"
                      initial={false}
                      animate={{ rotate: open ? 90 : 0 }}
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 360, damping: 30 }
                      }
                    >
                      <ChevronRight size={14} />
                    </motion.span>
                  </button>
                )}
                {compact && sectionIndex > 0 && <div className="mx-2 my-1.5 h-px bg-border" />}
                <motion.div
                  id={contentId}
                  initial={false}
                  animate={{ height: visible ? "auto" : 0, opacity: visible ? 1 : 0 }}
                  transition={
                    reducedMotion || compact
                      ? { duration: 0 }
                      : {
                          height: { type: "spring", stiffness: 320, damping: 34, mass: 0.8 },
                          opacity: { duration: visible ? 0.24 : 0.16, ease: ease2 },
                        }
                  }
                  aria-hidden={!visible}
                  inert={!visible}
                  className="flex flex-col gap-1 overflow-hidden"
                >
                  {items.map((navigationItem) => {
                    const { icon: Icon, label, path, badge, shortcut } = navigationItem;
                    const active = isNavigationItemActive(pathname, path);
                    const children = navigationChildren(navigationItem, pathname);
                    const hasChildren = children.length > 0;
                    const expanded = !compact && openItem === path;
                    const childId = `${selectionId}-${path.slice(1)}-children`;
                    const rowContents = (
                      <>
                        {active && (
                          <motion.span
                            aria-hidden="true"
                            layoutId="sidebar-selection"
                            initial={false}
                            transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 38 }}
                            className="pointer-events-none absolute inset-0 rounded-[inherit] border border-ink/12 bg-[linear-gradient(135deg,rgb(var(--ink-rgb)/12%),rgb(var(--ink-rgb)/5%))] shadow-[inset_0_1px_0_rgb(255_255_255/7%),0_2px_5px_rgb(0_0_0/12%)]"
                          />
                        )}
                        <span className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-[9px] ${active ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgb(0_229_160/12%),0_0_18px_rgb(0_229_160/14%)]" : ""}`}>
                          <Icon size={16} strokeWidth={active ? 1.9 : 1.65} />
                          {badge && compact ? (
                            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-[rgb(var(--surface-rgb))] bg-destructive text-[10px] font-bold text-white">{badge}</span>
                          ) : null}
                        </span>
                        {!compact && (
                          <span className="relative z-10 flex min-w-0 flex-1 items-center gap-1.5">
                            <span className="min-w-0 flex-1 truncate">{label}</span>
                            {badge ? <span className="rounded-full bg-destructive px-1.5 py-px text-[12px] font-bold text-white">{badge}</span> : null}
                            {shortcut && <kbd className="shrink-0 px-1 py-0.5 font-sans text-[12px] font-normal tracking-normal text-ink/70">Ctrl/⌘+⇧{shortcut}</kbd>}
                            {hasChildren ? (
                              <motion.span aria-hidden="true" initial={false} animate={{ rotate: expanded ? 90 : 0 }} transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 32 }} className="shrink-0 text-ink/45">
                                <ChevronRight size={14} strokeWidth={1.8} />
                              </motion.span>
                            ) : active ? <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_10px_rgba(0,229,160,0.7)]" /> : null}
                          </span>
                        )}
                      </>
                    );
                    return (
                      <div key={path} className="group relative">
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (compact) setCollapsed(false);
                              setOpenItem((current) => compact || current !== path ? path : null);
                            }}
                            aria-expanded={expanded}
                            aria-controls={compact ? undefined : childId}
                            aria-label={`${label}, ${expanded ? "recolher" : "expandir"} páginas`}
                            title={compact ? `Abrir ${label}` : undefined}
                            className={`${item} ${active ? "text-foreground" : ""} relative flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-[15px] font-medium tracking-[-0.015em]`}
                          >
                            {rowContents}
                          </button>
                        ) : (
                          <Link
                            href={path}
                            onClick={onNavigate}
                            aria-current={active ? "page" : undefined}
                            aria-label={shortcut ? `${label}, atalho Ctrl ou Command mais Shift mais ${shortcut}` : label}
                            aria-keyshortcuts={shortcut ? `Control+Shift+${shortcut} Meta+Shift+${shortcut}` : undefined}
                            title={compact ? `${label}${shortcut ? ` · Ctrl/⌘+Shift+${shortcut}` : ""}` : undefined}
                            className={`${item} ${active ? "text-foreground" : ""} relative flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-[15px] font-medium tracking-[-0.015em]`}
                          >
                            {rowContents}
                          </Link>
                        )}
                        {hasChildren && !compact && (
                          <motion.div
                            id={childId}
                            initial={false}
                            animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
                            transition={reducedMotion ? { duration: 0 } : { height: { type: "spring", stiffness: 360, damping: 38, mass: 0.75 }, opacity: { duration: expanded ? 0.2 : 0.12 } }}
                            aria-hidden={!expanded}
                            inert={!expanded}
                            className="overflow-hidden"
                          >
                            <div className="ml-[21px] border-l border-ink/10 py-1 pl-3">
                              {children.map((child, index) => {
                                const selected = pathname === child.path;
                                const startsContext = child.contextual && !children[index - 1]?.contextual;
                                return (
                                  <div key={child.path}>
                                    {startsContext && <div className="mx-2 mt-2 mb-1 border-t border-ink/[0.08] pt-2 text-[10px] font-semibold tracking-[0.08em] text-ink/40 uppercase">Neste registro</div>}
                                    <Link
                                      href={child.path}
                                      onClick={onNavigate}
                                      aria-current={selected ? "page" : undefined}
                                      className={`relative flex min-h-9 items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13.5px] font-medium tracking-[-0.01em] transition-[background,color,box-shadow] duration-150 motion-reduce:transition-none ${focus} ${selected ? "bg-primary/[0.09] text-foreground shadow-[inset_0_0_0_1px_rgb(0_229_160/12%)]" : "text-ink/65 hover:bg-ink/[0.055] hover:text-foreground"}`}
                                    >
                                      <span aria-hidden className={`size-1 shrink-0 rounded-full ${selected ? "bg-primary shadow-[0_0_8px_rgba(0,229,160,0.6)]" : "bg-ink/25"}`} />
                                      <span className="truncate">{child.label}</span>
                                    </Link>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              </div>
            );
          })}
        </motion.nav>
      </LayoutGroup>

      <div className="flex shrink-0 flex-col gap-2 border-t border-ink/[0.06] bg-[linear-gradient(180deg,transparent,rgb(0_0_0/8%))] p-2">
        {!compact && (
          <div className="flex items-center gap-2.5 rounded-xl border border-ink/[0.07] bg-[linear-gradient(125deg,rgb(var(--ink-rgb)/5%),rgb(var(--ink-rgb)/2%))] px-2.5 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/3%)]">
            <UserAvatar className="size-[30px] text-[11px]" showStatus />
            <span className="min-w-0 flex-1 overflow-hidden">
              <strong
                className="block truncate text-[14px] font-semibold tracking-[-0.015em]"
                title={profile?.email}
              >
                {profile ? firstNameOf(profile.name) : "Conta"}
              </strong>
              <small className="mt-0.5 block truncate text-[13px] font-normal text-ink/75">
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
          aria-keyshortcuts="Control+B Meta+B"
          className={`hidden w-full items-center justify-center gap-2 rounded-xl py-2.5 text-ink/75 transition hover:bg-ink/[0.06] hover:text-foreground active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 md:flex ${focus}`}
        >
          <ChevronRight
            size={14}
            aria-hidden
            className={`transition-transform motion-reduce:transition-none ${collapsed ? "" : "rotate-180"}`}
          />
          {!compact && <span className="text-[13px] font-medium">Recolher menu</span>}
          {!compact && <kbd className="text-[11px] text-ink/50">Ctrl/⌘+B</kbd>}
        </button>
      </div>
    </aside>
  );
}

export const Sidebar = memo(SidebarComponent);
