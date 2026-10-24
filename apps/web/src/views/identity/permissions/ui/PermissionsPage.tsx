"use client";
import { useEffect, useState } from "react";
import { userApi, type PermissionInfo } from "@/entities/user";
import { withSession } from "@/shared/auth/with-session";
import { PageHeader, secondaryActionClass } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";

export function PermissionsPage() {
  const [items, setItems] = useState<PermissionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    withSession(userApi.permissions())
      .then((result) => {
        if (active) {
          setItems(result);
          setLoading(false);
        }
      })
      .catch((reason) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : "Não foi possível carregar permissões.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  return (
    <Layout title="Permissões">
      <div className="pb-10">
        <PageHeader
          back={{ href: "/users", label: "Usuários" }}
          title="Permissões"
          description="Recursos e ações cadastrados para atribuição aos papéis."
        />
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
        ) : items.length ? (
          <div className="grid gap-3">
            {items.map((item) => (
              <article key={item.id} className="rounded-2xl border border-border bg-card p-5">
                <h2 className="m-0 font-semibold">
                  {item.resource}:{item.action}
                </h2>
                <p className="mb-0 mt-1 text-sm text-muted-foreground">
                  {item.description ?? "Sem descrição"}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Nenhuma permissão cadastrada.
          </p>
        )}
      </div>
    </Layout>
  );
}
