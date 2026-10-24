"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import {
  userApi,
  type PermissionInfo,
  type RoleDetail,
  type RoleMember,
  type RoleSummary,
} from "@/entities/user";
import { withSession } from "@/shared/auth/with-session";
import { PageHeader, primaryActionClass, secondaryActionClass } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";
import { rolePages } from "../model/pages";

type Section = "list" | "detail" | "members" | "permissions";
const date = (input: string | null) =>
  input ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(input)) : "—";

export function RolePage({ id, section }: { id?: string; section: Section }) {
  const config = id && section !== "list" ? rolePages[section](id) : rolePages.list;
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [role, setRole] = useState<RoleDetail | null>(null);
  const [permissions, setPermissions] = useState<PermissionInfo[]>([]);
  const [members, setMembers] = useState<RoleMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const load =
      section === "list"
        ? userApi.listRoles().then((result) => {
            if (active) setRoles(result.items);
          })
        : id
          ? Promise.all([
              userApi.role(id),
              section === "permissions"
                ? userApi.rolePermissions(id)
                : section === "members"
                  ? userApi.roleMembers(id)
                  : Promise.resolve([]),
            ]).then(([detail, items]) => {
              if (active) {
                setRole(detail);
                if (section === "permissions") setPermissions(items as PermissionInfo[]);
                if (section === "members") setMembers(items as RoleMember[]);
              }
            })
          : Promise.reject(new Error("Papel não informado."));
    withSession(load)
      .then(() => {
        if (active) setLoading(false);
      })
      .catch((reason) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : "Não foi possível carregar os papéis.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [id, section, attempt]);
  return (
    <Layout title={section === "list" ? "Papéis" : (role?.name ?? config.title)}>
      <div className="pb-10">
        <PageHeader
          back={
            section === "list"
              ? { href: "/users", label: "Usuários" }
              : {
                  href: section === "detail" ? "/users/roles" : (`/users/roles/${id}` as Route),
                  label: section === "detail" ? "Papéis" : (role?.name ?? "Papel"),
                }
          }
          title={section === "detail" ? (role?.name ?? "Papel") : config.title}
          description={config.description}
          actions={
            section === "list" ? (
              <Link href="/users/roles/new" className={primaryActionClass}>
                Novo papel
              </Link>
            ) : section === "detail" && role && !role.isSystem ? (
              <Link href={`/users/roles/${id}/edit` as Route} className={primaryActionClass}>
                Editar papel
              </Link>
            ) : undefined
          }
        />
        {loading ? (
          <p role="status" className="rounded-2xl border border-border bg-card p-6">
            Carregando…
          </p>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-border bg-card p-6">
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
            {section === "list" &&
              (roles.length ? (
                <div className="grid gap-3">
                  {roles.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-border bg-card p-5">
                      <Link
                        href={`/users/roles/${item.id}` as Route}
                        className="font-semibold hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="mb-0 mt-1 text-sm text-muted-foreground">
                        {item.description ?? "Sem descrição"}
                      </p>
                      <p className="mb-0 mt-2 text-sm">
                        {item.userCount} {item.userCount === 1 ? "membro" : "membros"} ·{" "}
                        {item.isSystem ? "Sistema" : "Personalizado"}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <Empty />
              ))}
            {section === "detail" && role && (
              <>
                <section className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="m-0 text-base font-semibold">Sobre o papel</h2>
                  <p className="mt-3 text-sm">{role.description ?? "Sem descrição"}</p>
                  <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">Origem</dt>
                      <dd>{role.isSystem ? "Sistema" : "Personalizado"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Papel pai</dt>
                      <dd>{role.parentRoleName ?? "Nenhum"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Membros</dt>
                      <dd>{role.userCount}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Atualizado</dt>
                      <dd>{date(role.updatedAt)}</dd>
                    </div>
                  </dl>
                </section>
                <nav aria-label="Explorar papel" className="mt-5 flex gap-2">
                  <Link
                    href={`/users/roles/${id}/permissions` as Route}
                    className={secondaryActionClass}
                  >
                    Permissões
                  </Link>
                  <Link
                    href={`/users/roles/${id}/members` as Route}
                    className={secondaryActionClass}
                  >
                    Membros
                  </Link>
                </nav>
              </>
            )}
            {section === "permissions" &&
              (permissions.length ? (
                <div className="grid gap-3">
                  {permissions.map((item) => (
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
                <Empty />
              ))}
            {section === "members" &&
              (members.length ? (
                <div className="grid gap-3">
                  {members.map((item) => (
                    <article
                      key={item.userId}
                      className="rounded-2xl border border-border bg-card p-5"
                    >
                      <Link
                        href={`/users/${item.userId}` as Route}
                        className="font-semibold hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="mb-0 mt-1 text-sm text-muted-foreground">{item.email}</p>
                      <p className="mb-0 mt-2 text-sm">
                        {item.status} · Concedido: {date(item.grantedAt)} · Expira:{" "}
                        {date(item.expiresAt)}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <Empty />
              ))}
          </>
        )}
      </div>
    </Layout>
  );
}
function Empty() {
  return (
    <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
      Nenhum registro encontrado.
    </p>
  );
}
