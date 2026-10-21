"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CurrentUserProvider } from "./model/current-user";
import { isNavigationItemActive, navigationItems } from "./model/navigation";
import { useTrackRecentPage } from "./model/hooks";
import type { LayoutProps } from "./model/types";
import { AppHeader } from "./ui/AppHeader";
import { Sidebar } from "./ui/Sidebar";

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
      if (!(event.metaKey || event.ctrlKey)) return;

      if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        setSidebarCollapsed((collapsed) => !collapsed);
        return;
      }

      const target = navigationItems.find((item) => item.shortcut === `⌘${event.key}`);
      if (target) {
        event.preventDefault();
        router.push(target.path);
      }
    };

    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, [router]);

  return (
    <ShellContext.Provider value={true}>
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
          <AppHeader title={title} onMenuClick={toggleMobileNavigation} />
          <main className="relative flex-1 overflow-x-hidden overflow-y-auto px-3.5 py-[18px] md:px-6 md:py-6 xl:px-8 xl:py-7">
            <motion.div
              key={pathname}
              initial={reducedMotion ? false : { y: 6 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="min-w-0"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
      </CurrentUserProvider>
    </ShellContext.Provider>
  );
}
