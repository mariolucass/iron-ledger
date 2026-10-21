"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface RemotePage<T> {
  items: T[];
  total: number;
}

interface State<T> extends RemotePage<T> {
  loading: boolean;
  error: string;
}

/**
 * Carrega uma lista paginada e refaz a busca quando `deps` mudam.
 *
 * - Respostas atrasadas de buscas antigas são descartadas (sem "corrida" entre filtros).
 * - Em erro, mantém os itens anteriores e expõe a mensagem.
 * - `reload` atualiza em silêncio, sem acender `loading` (para polling);
 *   `refresh` refaz a busca mostrando o carregamento.
 */
export function useRemoteList<T>(fetcher: () => Promise<RemotePage<T>>, deps: readonly unknown[]) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const latest = useRef(0);
  const [state, setState] = useState<State<T>>({ items: [], total: 0, loading: true, error: "" });

  const run = useCallback(async (silent: boolean) => {
    const id = ++latest.current;
    if (!silent) setState((current) => ({ ...current, loading: true }));
    try {
      const body = await fetcherRef.current();
      if (id === latest.current) setState({ items: body.items, total: body.total, loading: false, error: "" });
    } catch (reason) {
      if (id !== latest.current) return;
      const error = reason instanceof Error ? reason.message : "Não foi possível carregar a lista.";
      setState((current) => ({ ...current, loading: false, error }));
    }
  }, []);

  useEffect(() => {
    void run(false);
    return () => {
      latest.current++;
    };
    // `deps` é a lista de filtros definida por quem chama.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const reload = useCallback(() => run(true), [run]);
  const refresh = useCallback(() => run(false), [run]);

  return { ...state, reload, refresh };
}
