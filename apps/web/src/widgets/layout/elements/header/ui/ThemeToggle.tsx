"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/shared/lib/use-theme";

/** Both icons stay mounted and cross-fade from the root data-theme, so SSR and first paint never flicker. */
export function ThemeToggle({ className }: { className: string }) {
  const { theme, toggleTheme } = useTheme();
  const icon =
    "absolute transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
      title={theme === "light" ? "Modo escuro" : "Modo claro"}
      className={`${className} relative flex size-10 shrink-0 items-center justify-center rounded-xl`}
    >
      <Sun
        size={16}
        strokeWidth={1.65}
        aria-hidden
        className={`${icon} in-data-[theme=light]:scale-50 in-data-[theme=light]:-rotate-90 in-data-[theme=light]:opacity-0`}
      />
      <Moon
        size={16}
        strokeWidth={1.65}
        aria-hidden
        className={`${icon} scale-50 rotate-90 opacity-0 in-data-[theme=light]:scale-100 in-data-[theme=light]:rotate-0 in-data-[theme=light]:opacity-100`}
      />
    </button>
  );
}
