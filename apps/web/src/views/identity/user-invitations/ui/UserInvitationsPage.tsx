"use client";
import { useEffect, useState } from "react";
import { userApi, type InvitationInfo } from "@/entities/user";
import { withSession } from "@/shared/auth/with-session";
import { PageHeader, secondaryActionClass } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";
const date = (input: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(input),
  );
export function UserInvitationsPage() {
  const [items, setItems] = useState<InvitationInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    withSession(userApi.invitations())
      .then((result) => {
        if (active) {
          setItems(result);
          setLoading(false);
        }
      })
      .catch((reason) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : "Não foi possível carregar convites.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  return (
    <Layout title="Convites">
      <div className="pb-10">
        <PageHeader
          back={{ href: "/users", label: "Usuários" }}
          title="Convites"
          description="Tokens de convite registrados para usuários, sem exibir os códigos secretos."
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
                <h2 className="m-0 font-semibold">{item.name}</h2>
                <p className="mb-0 mt-1 text-sm text-muted-foreground">{item.email}</p>
                <p className="mb-0 mt-2 text-sm">
                  {item.consumedAt
                    ? `Aceito em ${date(item.consumedAt)}`
                    : new Date(item.expiresAt) < new Date()
                      ? "Expirado"
                      : "Pendente"}{" "}
                  · Criado em {date(item.createdAt)} · Expira em {date(item.expiresAt)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Nenhum convite registrado. Novos usuários são cadastrados diretamente em “Novo usuário”.
          </p>
        )}
      </div>
    </Layout>
  );
}
