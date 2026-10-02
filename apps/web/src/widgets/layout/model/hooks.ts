"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { navigationItems } from "./navigation";
import type { NavigationItem } from "./types";

const RECENT_PATHS_KEY = "il_recent_paths";

function rememberPath(pathname: string) {
  const previous = JSON.parse(sessionStorage.getItem(RECENT_PATHS_KEY) ?? "[]") as string[];
  const paths = [pathname, ...previous.filter((path) => path !== pathname)].slice(0, 5);
  sessionStorage.setItem(RECENT_PATHS_KEY, JSON.stringify(paths));
  return paths;
}

export function useClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    update();
    const interval = window.setInterval(update, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return time;
}

export function useRecentPages() {
  const pathname = usePathname();
  const [recentPages, setRecentPages] = useState<NavigationItem[]>([]);

  useEffect(() => {
    try {
      const paths = rememberPath(pathname);
      setRecentPages(paths.map((path) => navigationItems.find((item) => item.path === path)).filter((item): item is NavigationItem => Boolean(item)));
    } catch {
      setRecentPages([]);
    }
  }, [pathname]);

  return recentPages;
}

export function useTrackRecentPage() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      rememberPath(pathname);
    } catch {
      // Storage can be unavailable in private or restricted browser contexts.
    }
  }, [pathname]);
}
