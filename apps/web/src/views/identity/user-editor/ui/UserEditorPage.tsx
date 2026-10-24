"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserStatusBadge, userApi, type RoleSummary, type UserDetail } from "@/entities/user";
import { UserForm } from "@/features/identity/manage-user";
import { withSession } from "@/shared/auth/with-session";
import type { Status } from "@/shared/ui/form-primitives";
import { FormPage } from "@/shared/ui/form-page";
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
      .then(([roles, user]) => {
        if (!cancelled) setState({ phase: "ready", roles: roles.items, user });
      })
      .catch((reason) => {
        if (!cancelled)
          setState({
            phase: "error",
            message:
              reason instanceof Error ? reason.message : "Não foi possível carregar o usuário.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);

  const user = state.phase === "ready" ? state.user : undefined;

  return (
    <Layout title={user ? user.name : "Novo usuário"}>
      <FormPage
        back={{ href: "/users", label: "Usuários" }}
        title={userId ? (user?.name ?? "Usuário") : "Novo usuário"}
        description={userId ? undefined : "Crie uma conta de acesso e defina seus papéis."}
        badges={user && <UserStatusBadge status={user.status} />}
        meta={
          user && (
            <>
              {user.email} · Criado em {dateTime.format(new Date(user.createdAt))} ·{" "}
              {user.lastLoginAt
                ? `Último acesso em ${dateTime.format(new Date(user.lastLoginAt))}`
                : "Nunca acessou"}
            </>
          )
        }
        loading={state.phase === "loading"}
        error={state.phase === "error" ? state.message : undefined}
        onRetry={() => setAttempt((n) => n + 1)}
        notice={notice}
      >
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
      </FormPage>
    </Layout>
  );
}
