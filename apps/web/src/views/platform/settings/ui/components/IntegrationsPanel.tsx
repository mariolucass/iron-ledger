"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { userApi, type UserApiKeyInfo } from "@/entities/user";
import { withSession } from "@/shared/auth/with-session";
import { secondaryActionClass } from "@/shared/ui/data-list";

export function IntegrationsPanel() {
  const [keys, setKeys] = useState<UserApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    withSession(userApi.myApiKeys())
      .then((items) => {
        if (active) {
          setKeys(items);
          setLoading(false);
        }
      })
      .catch((reason) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : "Não foi possível carregar as chaves.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  return (
    <section aria-label="API e integrações">
      <h2 className="mt-0 text-lg font-semibold">Chaves de API</h2>
      <p className="text-sm text-muted-foreground">
        Credenciais vinculadas à sua conta. O valor secreto das chaves não é exibido.
      </p>
      {loading ? (
        <p role="status">Carregando…</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button
            type="button"
            className={secondaryActionClass}
            onClick={() => setAttempt((value) => value + 1)}
          >
            Tentar novamente
          </button>
        </div>
      ) : keys.length ? (
        <div className="grid gap-3">
          {keys.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-background p-4">
              <p className="m-0 font-semibold">{item.name}</p>
              <p className="mb-0 mt-1 font-mono text-xs text-muted-foreground">
                {item.prefix} · {item.status}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhuma chave de API vinculada à sua conta.</p>
      )}
      <Link href="/settings/api-keys" className={`mt-5 ${secondaryActionClass}`}>
        Ver minhas chaves
      </Link>
    </section>
  );
}
