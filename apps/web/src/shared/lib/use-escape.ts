"use client";

import { useEffect } from "react";

/** Chama `onEscape` quando a tecla Esc é pressionada enquanto o componente está montado. */
export function useEscape(onEscape: () => void) {
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onEscape]);
}
