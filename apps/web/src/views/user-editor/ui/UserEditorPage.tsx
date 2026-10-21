"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserStatusBadge, userApi, type RoleSummary, type UserDetail } from "@/entities/user";
import { UserForm } from "@/features/manage-user";
import { withSession } from "@/shared/auth/with-session";
import { PageHeader } from "@/shared/ui/data-list";
import { StatusMessage, type Status } from "@/shared/ui/form-primitives";
import { Button } from "@/shared/ui/kit/button";
import { Layout } from "@/widgets/layout";

type State =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; roles: RoleSummary[]; user?: UserDetail };

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

/** Cadastro (sem `userId`) e edição de usuário com seus papéis. */
export function UserEditorPage({ userId }: { userId?: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ phase: "loading" });
  const [notice, setNotice] = useState<Status>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ phase: "loading" });
    Promise.all([
      withSession(userApi.listRoles()),
      userId ? withSession(userApi.get(userId)) : Promise.resolve(undefined),
    ])
      .then(([roles, user]) => { if (!cancelled) setState({ phase: "ready", roles: roles.items, user }); })
      .catch((reason) => {
        if (!cancelled) setState({ phase: "error", message: reason instanceof Error ? reason.message : "Não foi possível carregar o usuário." });
      });
    return () => { cancelled = true; };
  }, [userId, attempt]);

  const user = state.phase === "ready" ? state.user : undefined;

  return (
    <Layout title={user ? user.name : "Novo usuário"}>
      <PageHeader
        back={{ href: "/users", label: "Usuários" }}
        title={userId ? (user?.name ?? "Usuário") : "Novo usuário"}
        badges={user && <UserStatusBadge status={user.status} />}
        meta={
          user && (
            <>
              {user.email} · Criado em {dateTime.format(new Date(user.createdAt))} ·{" "}
              {user.lastLoginAt ? `Último acesso em ${dateTime.format(new Date(user.lastLoginAt))}` : "Nunca acessou"}
            </>
          )
        }
      />

      <div className="mb-4 max-w-[960px]"><StatusMessage status={notice} /></div>

      {state.phase === "loading" && <div className="h-96 max-w-[960px] animate-pulse rounded-xl bg-white/[0.035]" aria-label="Carregando" />}
      {state.phase === "error" && (
        <div role="alert" className="grid max-w-[960px] justify-items-start gap-4">
          <p className="m-0 text-sm text-destructive">{state.message}</p>
          <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>Tentar novamente</Button>
        </div>
      )}
      {state.phase === "ready" && (
        <UserForm
          key={user ? `${user.id}-${user.updatedAt}` : "new"}
          user={state.user}
          roles={state.roles}
          onCancel={() => router.push("/users")}
          onSaved={(saved, mode) => {
            if (mode === "created") {
              router.push(`/users/${saved.id}`);
              return;
            }
            setState({ phase: "ready", roles: state.roles, user: saved });
            setNotice({ type: "success", message: "Usuário atualizado." });
          }}
        />
      )}
    </Layout>
  );
}
