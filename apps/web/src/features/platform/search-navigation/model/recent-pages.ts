"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { searchEntries, type SearchEntry } from "./search-entries";

const RECENT_PATHS_KEY = "il_recent_paths";

function rememberPath(pathname: string) {
  const previous = JSON.parse(sessionStorage.getItem(RECENT_PATHS_KEY) ?? "[]") as string[];
  const paths = [pathname, ...previous.filter((path) => path !== pathname)].slice(0, 5);
  sessionStorage.setItem(RECENT_PATHS_KEY, JSON.stringify(paths));
  return paths;
}

export function useRecentPages() {
  const pathname = usePathname();
  const [recentPages, setRecentPages] = useState<SearchEntry[]>([]);

  useEffect(() => {
    try {
      const paths = rememberPath(pathname);
      setRecentPages(paths.map((path) => searchEntries.find((entry) => entry.path === path)).filter((entry): entry is SearchEntry => Boolean(entry)));
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
