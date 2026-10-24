"use client";
import { useEffect, useState } from "react";
import { auditLogApi, AuditActionBadge, type AuditLog } from "@/entities/audit-log";
import { withSession } from "@/shared/auth/with-session";
import { PageHeader, secondaryActionClass } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";
const date = (input: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(input),
  );
export function UserAuditLogPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    withSession(auditLogApi.list({ userActorsOnly: true, page, pageSize: 20 }))
      .then((result) => {
        if (active) {
          setItems(result.items);
          setTotal(result.total);
          setLoading(false);
        }
      })
      .catch((reason) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : "Não foi possível carregar auditoria.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [page, attempt]);
  return (
    <Layout title="Auditoria de usuários">
      <div className="pb-10">
        <PageHeader
          back={{ href: "/users", label: "Usuários" }}
          title="Auditoria de usuários"
          description="Ações registradas por usuários. Para filtrar por pessoa, abra a auditoria no perfil dela."
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
        ) : (
          <>
            {items.length ? (
              <div className="grid gap-3">
                {items.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="m-0 font-semibold">{item.eventName}</h2>
                      <AuditActionBadge action={item.action} />
                    </div>
                    <p className="mb-0 mt-2 text-sm text-muted-foreground">
                      {date(item.occurredAt)} · {item.actorEmail ?? "Sistema"}
                    </p>
                    <p className="mb-0 mt-1 break-all font-mono text-xs">
                      {item.entityType} · {item.entityId}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                Nenhum evento registrado.
              </p>
            )}
            {total > 20 && (
              <nav aria-label="Paginação" className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  className={secondaryActionClass}
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Anterior
                </button>
                <span className="text-sm">
                  Página {page} de {Math.ceil(total / 20)}
                </span>
                <button
                  type="button"
                  className={secondaryActionClass}
                  disabled={page * 20 >= total}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Próxima
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
