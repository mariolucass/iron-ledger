"use client";

import { useLayoutEffect } from "react";
import { THEME_STORAGE_KEY } from "@/shared/config/theme";

/** Follows the theme chosen in the application menu on pages that have no toggle of their own. */
export function PublicThemeSync() {
  useLayoutEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {}
    if (stored === "light") document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
  }, []);
  return null;
}
