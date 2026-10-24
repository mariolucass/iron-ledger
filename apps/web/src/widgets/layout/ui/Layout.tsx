"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CurrentUserProvider } from "@/entities/user";
import { ThemeProvider } from "@/shared/lib/use-theme";
import { isNavigationItemActive, navigationItems, navigationShortcutItems } from "@/shared/config/app-navigation";
import { useTrackRecentPage } from "@/features/platform/search-navigation";
import type { LayoutProps } from "../model/types";
import { AppHeader } from "../elements/header/ui/AppHeader";
import { Sidebar } from "../elements/sidebar/ui/Sidebar";

const ShellContext = createContext(false);

/** Keep the navigation mounted above page boundaries during client navigation. */
export function ApplicationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const item = navigationItems.find((item) => isNavigationItemActive(pathname, item.path));
  if (!item) return children;
  return <PersistentLayout title={item.label}>{children}</PersistentLayout>;
}

/** Page-level wrappers remain compatible with the shared application shell. */
export function Layout({ children, title }: LayoutProps) {
  const withinShell = useContext(ShellContext);
  return withinShell ? children : <PersistentLayout title={title}>{children}</PersistentLayout>;
}

function PersistentLayout({ children, title }: LayoutProps) {
  const reducedMotion = useReducedMotion();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  useTrackRecentPage();

  const closeMobileNavigation = useCallback(() => setMobileNavigationOpen(false), []);
  const toggleMobileNavigation = useCallback(() => setMobileNavigationOpen((open) => !open), []);

  useEffect(() => setMobileNavigationOpen(false), [pathname]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.repeat || event.altKey || !(event.metaKey || event.ctrlKey)) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')) return;

      if (!event.shiftKey && event.key.toLowerCase() === "b") {
        event.preventDefault();
        if (window.matchMedia("(min-width: 768px)").matches) {
          setSidebarCollapsed((collapsed) => !collapsed);
        } else {
          setMobileNavigationOpen((open) => !open);
        }
        return;
      }

      // Shift changes event.key on many keyboard layouts; event.code keeps the digit stable.
      const digit = /^Digit([1-9])$/.exec(event.code)?.[1];
      const destination = digit ? navigationShortcutItems.get(digit) : undefined;
      if (destination) {
        event.preventDefault();
        router.push(destination.path);
      }
    };

    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, [router]);

  return (
    <ShellContext.Provider value={true}>
      <ThemeProvider>
      <CurrentUserProvider>
        <div className="relative flex h-dvh overflow-hidden bg-background font-sans text-foreground">
          <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <div className="absolute -top-[15%] left-1/4 size-[600px] rounded-full bg-primary/[0.055] blur-[60px]" />
            <div className="absolute right-[5%] bottom-[5%] size-[400px] rounded-full bg-purple/[0.04] blur-[70px]" />
          </div>

          <Sidebar
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            mobileOpen={mobileNavigationOpen}
            onNavigate={closeMobileNavigation}
          />

          <AnimatePresence>
            {mobileNavigationOpen && (
              <motion.button
                type="button"
                aria-label="Fechar menu"
                onClick={closeMobileNavigation}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 border-0 bg-black/60 backdrop-blur-sm md:hidden"
              />
            )}
          </AnimatePresence>

          <div className="relative z-[1] flex min-w-0 flex-1 flex-col overflow-hidden">
            <AppHeader title={title} onMenuClick={toggleMobileNavigation} mobileMenuOpen={mobileNavigationOpen} />
            <div className="relative min-h-0 flex-1 overflow-hidden bg-canvas">
              <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className="absolute inset-0 opacity-[var(--orb-opacity)]">
                <div className="absolute -top-[18%] -left-[8%] size-[620px] rounded-full bg-[radial-gradient(circle,rgb(99_102_241/42%),transparent_68%)] blur-[70px] motion-safe:animate-[orb-drift-a_28s_ease-in-out_infinite]" />
                <div className="absolute top-[8%] -right-[10%] size-[560px] rounded-full bg-[radial-gradient(circle,rgb(168_85_247/34%),transparent_68%)] blur-[80px] motion-safe:animate-[orb-drift-b_34s_ease-in-out_infinite]" />
                <div className="absolute -bottom-[22%] left-[22%] size-[640px] rounded-full bg-[radial-gradient(circle,rgb(56_189_248/28%),transparent_68%)] blur-[90px] motion-safe:animate-[orb-drift-c_38s_ease-in-out_infinite]" />
                <div className="absolute right-[12%] -bottom-[12%] size-[420px] rounded-full bg-[radial-gradient(circle,rgb(244_114_182/20%),transparent_68%)] blur-[80px] motion-safe:animate-[orb-drift-a_42s_ease-in-out_infinite_reverse]" />
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,var(--canvas-glow),transparent_55%),linear-gradient(180deg,transparent_60%,var(--canvas-vignette))]" />
                <div className="absolute inset-0 opacity-[0.035] mix-blend-overlay [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%222%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>')]" />
              </div>
              <main className="absolute inset-0 z-10 overflow-x-hidden overflow-y-auto px-4 pt-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:px-6 md:py-6 xl:px-8 xl:py-8">
                <motion.div
                  key={pathname}
                  initial={reducedMotion ? false : { y: 6 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full min-w-0 max-w-[1280px]"
                >
                  {children}
                </motion.div>
              </main>
            </div>
          </div>
        </div>
      </CurrentUserProvider>
      </ThemeProvider>
    </ShellContext.Provider>
  );
}
