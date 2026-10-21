"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { userApi, type Profile } from "@/entities/user";
import { withSession } from "@/shared/auth/with-session";

interface CurrentUserState {
  profile: Profile | null;
  loading: boolean;
}

const CurrentUserContext = createContext<CurrentUserState>({ profile: null, loading: false });

/** Busca o usuário uma vez por montagem do shell; sidebar, header e menus leem do mesmo contexto. */
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CurrentUserState>({ profile: null, loading: true });

  useEffect(() => {
    let cancelled = false;
    withSession(userApi.me())
      .then((profile) => { if (!cancelled) setState({ profile, loading: false }); })
      .catch(() => { if (!cancelled) setState({ profile: null, loading: false }); });
    return () => { cancelled = true; };
  }, []);

  return <CurrentUserContext.Provider value={state}>{children}</CurrentUserContext.Provider>;
}

export const useCurrentUser = () => useContext(CurrentUserContext);

/** "Maria da Silva" -> "MS"; sem nome, "·". */
export function initialsOf(name?: string | null): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "·";
  const first = words[0]![0]!;
  const last = words.length > 1 ? words[words.length - 1]![0]! : "";
  return `${first}${last}`.toLocaleUpperCase("pt-BR");
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  CATALOG_MANAGER: "Gestor de catálogo",
  WAREHOUSE_MANAGER: "Gestor de armazéns",
  SERVICE: "Conta de serviço",
};

export function roleLabelOf(roles: readonly string[] | undefined): string {
  const first = roles?.[0];
  return first ? (roleLabels[first] ?? first) : "Sem papel";
}

export const firstNameOf = (name?: string | null) => (name ?? "").trim().split(/\s+/)[0] || "Conta";
