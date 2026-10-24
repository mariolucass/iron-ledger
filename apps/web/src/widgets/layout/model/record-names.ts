"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { platformApi } from "@/entities/platform";
import { productApi } from "@/entities/product";
import { transactionApi } from "@/entities/transaction";
import { userApi } from "@/entities/user";
import { warehouseApi } from "@/entities/warehouse";
import { withSession } from "@/shared/auth/with-session";
import { navigationRecordMatches } from "@/shared/config/app-navigation";
import type { NavigationRecordMatch } from "@/shared/config/app-navigation-types";

/** Nome exibido por tipo de registro; padrões ausentes mostram somente o tipo (`record.label`). */
const loaders: Partial<Record<string, (params: string[]) => Promise<string>>> = {
  "/products/[id]": ([id]) => productApi.get(id!).then((product) => product.name),
  "/warehouses/[id]": ([id]) => warehouseApi.get(id!).then((warehouse) => warehouse.name),
  "/warehouses/[id]/locations/[locationId]": ([id, locationId]) =>
    warehouseApi.location(id!, locationId!).then((location) => location.code),
  "/transactions/[id]": ([id]) => transactionApi.get(id!).then((transaction) => transaction.code),
  "/users/[id]": ([id]) => userApi.get(id!).then((user) => user.name),
  "/users/roles/[id]": ([id]) => userApi.role(id!).then((role) => role.name),
  "/system/feature-flags/[id]": ([id]) => platformApi.flag(id!).then((flag) => flag.key),
};

// Cache compartilhado pela barra lateral e pela trilha: uma requisição por registro e navegação.
const names = new Map<string, string | null>();
const requests = new Set<string>();
const listeners = new Set<() => void>();
let version = 0;

function store(path: string, name: string | null) {
  names.set(path, name);
  version += 1;
  listeners.forEach((listener) => listener());
}

/** Busca o nome em segundo plano; o valor anterior continua visível até a resposta (ex.: depois de editar). */
function refresh(record: NavigationRecordMatch) {
  const loader = loaders[record.pattern];
  if (!loader || requests.has(record.path)) return;
  requests.add(record.path);
  withSession(loader(record.params))
    .then((name) => store(record.path, name))
    .catch(() => {
      // A página do registro apresenta o erro; a navegação mantém o rótulo do tipo.
      if (!names.has(record.path)) store(record.path, null);
    })
    .finally(() => requests.delete(record.path));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const snapshot = () => version;

/**
 * Nomes dos registros da rota atual. `nameOf` devolve o nome, `undefined` enquanto carrega
 * e `null` quando o tipo não tem nome a buscar ou a busca falhou.
 */
export function useRecordNames() {
  const pathname = usePathname();
  const current = useSyncExternalStore(subscribe, snapshot, snapshot);

  useEffect(() => {
    navigationRecordMatches(pathname).forEach(refresh);
  }, [pathname]);

  return useCallback(
    (record: NavigationRecordMatch): string | null | undefined =>
      loaders[record.pattern] ? names.get(record.path) : null,
    // `current` muda a cada nome recebido e renova a função para os consumidores.
    [current],
  );
}
