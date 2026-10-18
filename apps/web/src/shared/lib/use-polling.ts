"use client";

import { useEffect, useRef } from "react";

/**
 * Executa `task` a cada `intervalMs` enquanto `enabled` for verdadeiro e a aba
 * estiver visível. Nunca sobrepõe execuções: a próxima só é agendada ao terminar.
 */
export function usePolling(task: () => Promise<unknown>, intervalMs: number, enabled: boolean): void {
  const latest = useRef(task);
  latest.current = task;

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = true;
    const tick = async () => {
      if (document.visibilityState === "visible") await latest.current().catch(() => undefined);
      if (active) timer = setTimeout(tick, intervalMs);
    };
    timer = setTimeout(tick, intervalMs);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [enabled, intervalMs]);
}
