"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { alertApi, type AlertItem } from "@/entities/alert";
import { withSession } from "@/shared/auth/with-session";

const POLL_INTERVAL_MS = 15_000;
const SEVERITY_RANK = { CRITICAL: 0, WARNING: 1, INFO: 2 } as const;

interface AlertFeedState {
  /** Alertas em aberto (ainda não reconhecidos nem resolvidos), mais graves e recentes primeiro. */
  open: AlertItem[];
  openCount: number;
  loading: boolean;
  /** Rebusca na hora, para o contador refletir ações do usuário sem esperar o polling. */
  refresh: () => Promise<void>;
}

const AlertFeedContext = createContext<AlertFeedState>({
  open: [],
  openCount: 0,
  loading: false,
  refresh: async () => {},
});

/** Um único polling de alertas por montagem do shell; header e sidebar leem do mesmo contexto. */
export function AlertFeedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<AlertItem[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const result = await withSession(alertApi.list());
      setItems(result.items);
      setOpenCount(result.counts.open);
    } catch {
      // Mantém o último estado conhecido; a página de alertas exibe o erro detalhado.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const value = useMemo<AlertFeedState>(
    () => ({
      open: items
        .filter(({ status }) => status === "OPEN")
        .sort(
          (a, b) =>
            SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
            Date.parse(b.lastSeenAt) - Date.parse(a.lastSeenAt),
        ),
      openCount,
      loading,
      refresh,
    }),
    [items, openCount, loading, refresh],
  );

  return <AlertFeedContext.Provider value={value}>{children}</AlertFeedContext.Provider>;
}

export const useAlertFeed = () => useContext(AlertFeedContext);
