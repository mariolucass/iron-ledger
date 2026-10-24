"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { auditLogApi, type AuditLog } from "@/entities/audit-log";
import { userApi, UserStatusBadge, type UserDetail } from "@/entities/user";
import { withSession } from "@/shared/auth/with-session";
import { PageHeader, primaryActionClass, secondaryActionClass } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";
import { userDetailPages } from "../model/pages";

type Section =
  "profile" | "roles" | "warehouses" | "sessions" | "security" | "apiKeys" | "auditLog";
type Row = {
  id: string;
  title: string;
  subtitle?: string;
  fields: string[][];
  href?: Route;
};
const date = (input: string | null) =>
  input
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
        new Date(input),
      )
    : "—";
const sections: [Section, string, string][] = [
  ["roles", "roles", "Papéis"],
  ["warehouses", "warehouses", "Armazéns"],
  ["sessions", "sessions", "Sessões"],
  ["security", "security", "Segurança"],
  ["apiKeys", "api-keys", "Chaves de API"],
  ["auditLog", "audit-log", "Auditoria"],
];

async function loadSection(
  id: string,
  section: Section,
  user: UserDetail,
  page: number,
): Promise<{ rows: Row[]; total: number; note?: string }> {
  switch (section) {
    case "profile":
      return { rows: [], total: 0 };
    case "roles":
      return {
        total: user.roles.length,
        rows: user.roles.map((role) => ({
          id: role.name,
          title: role.name,
          fields: [
            ["Concedido", date(role.grantedAt)],
            ["Expira", date(role.expiresAt)],
          ],
        })),
      };
    case "warehouses": {
      const items = await userApi.warehouses(id);
      return {
        total: items.length,
        rows: items.map((item) => ({
          id: item.warehouseId,
          title: item.name,
          subtitle: item.code,
          href: `/warehouses/${item.warehouseId}` as Route,
          fields: [
            ["Nível", item.accessLevel],
            ["Estado", item.isActive ? "Ativo" : "Inativo"],
            ["Concedido", date(item.grantedAt)],
            ["Expira", date(item.expiresAt)],
          ],
        })),
      };
    }
    case "sessions": {
      const items = await userApi.sessions(id);
      return {
        total: items.length,
        note: "Até 100 sessões recentes.",
        rows: items.map((item) => ({
          id: item.id,
          title: item.userAgent ?? "Dispositivo não identificado",
          subtitle: item.ipAddress ?? "IP não informado",
          fields: [
            ["Estado", item.status],
            ["Criada", date(item.createdAt)],
            ["Último uso", date(item.lastUsedAt)],
            ["Expira", date(item.expiresAt)],
            ["Revogada", date(item.revokedAt)],
          ],
        })),
      };
    }
    case "security": {
      const info = await userApi.security(id);
      return {
        total: 1 + info.factors.length + info.identities.length,
        rows: [
          {
            id: "posture",
            title: "Estado da conta",
            fields: [
              ["MFA", info.mfaEnabled ? "Ativado" : "Desativado"],
              ["Falhas de login", String(info.failedLoginAttempts)],
              ["Bloqueio até", date(info.lockedUntil)],
              ["Senha alterada", date(info.passwordChangedAt)],
              ["ID externo", info.externalId ?? "—"],
            ],
          },
          ...info.factors.map((item) => ({
            id: `factor-${item.id}`,
            title: `Fator ${item.method}`,
            subtitle: item.label ?? undefined,
            fields: [
              ["Verificado", date(item.verifiedAt)],
              ["Último uso", date(item.lastUsedAt)],
            ],
          })),
          ...info.identities.map((item) => ({
            id: `identity-${item.id}`,
            title: `Identidade ${item.provider}`,
            subtitle: item.email ?? item.providerKey,
            fields: [
              ["Último acesso", date(item.lastLoginAt)],
              ["Vinculada", date(item.createdAt)],
            ],
          })),
        ],
      };
    }
    case "apiKeys": {
      const items = await userApi.apiKeys(id);
      return {
        total: items.length,
        rows: items.map((item) => ({
          id: item.id,
          title: item.name,
          subtitle: item.prefix,
          fields: [
            ["Estado", item.status],
            ["Permissões", item.permissions.join(", ") || "Nenhuma"],
            ["IPs permitidos", item.allowedIps.join(", ") || "Sem restrição"],
            ["Último uso", date(item.lastUsedAt)],
            ["Expira", date(item.expiresAt)],
          ],
        })),
      };
    }
    case "auditLog": {
      const result = await auditLogApi.list({ actor: id, page, pageSize: 20 });
      return {
        total: result.total,
        rows: result.items.map((item: AuditLog) => ({
          id: item.id,
          title: item.eventName,
          subtitle: date(item.occurredAt),
          fields: [
            ["Ação", item.action],
            ["Recurso", `${item.entityType} · ${item.entityId}`],
            ["Correlação", item.correlationId ?? "—"],
          ],
        })),
      };
    }
  }
}

export function UserDetailPage({ id, section }: { id: string; section: Section }) {
  const config = userDetailPages[section](id);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [note, setNote] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    withSession(userApi.get(id))
      .then(async (detail) => {
        const result = await withSession(loadSection(id, section, detail, page));
        if (active) {
          setUser(detail);
          setRows(result.rows);
          setTotal(result.total);
          setNote(result.note);
          setLoading(false);
        }
      })
      .catch((reason) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : "Não foi possível carregar o usuário.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [id, section, page, attempt]);
  return (
    <Layout title={section === "profile" ? (user?.name ?? "Usuário") : config.title}>
      <div className="pb-10">
        <PageHeader
          back={
            section === "profile"
              ? { href: "/users", label: "Usuários" }
              : { href: `/users/${id}` as Route, label: user?.name ?? "Usuário" }
          }
          title={section === "profile" ? (user?.name ?? "Usuário") : config.title}
          description={
            section === "profile" ? (user?.email ?? config.description) : config.description
          }
          badges={user ? <UserStatusBadge status={user.status} /> : undefined}
          actions={
            section === "profile" && user ? (
              <Link href={`/users/${id}/edit` as Route} className={primaryActionClass}>
                Editar usuário
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
          user && (
            <>
              {section === "profile" ? (
                <>
                  <section className="rounded-2xl border border-border bg-card p-5">
                    <h2 className="m-0 text-base font-semibold">Conta</h2>
                    <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        ["E-mail", user.email],
                        ["Verificado", date(user.emailVerifiedAt)],
                        ["MFA", user.mfaEnabled ? "Ativado" : "Desativado"],
                        ["Último acesso", date(user.lastLoginAt)],
                        ["Criado", date(user.createdAt)],
                        ["Atualizado", date(user.updatedAt)],
                      ].map(([label, field]) => (
                        <div key={label}>
                          <dt className="text-muted-foreground">{label}</dt>
                          <dd className="mt-1 break-words font-medium">{field}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                  <nav aria-label="Explorar usuário" className="mt-5 flex flex-wrap gap-2">
                    {sections.map(([key, path, label]) => (
                      <Link
                        key={key}
                        href={`/users/${id}/${path}` as Route}
                        className={secondaryActionClass}
                      >
                        {label}
                      </Link>
                    ))}
                  </nav>
                </>
              ) : (
                <>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {total} {total === 1 ? "registro" : "registros"}
                    {note ? ` · ${note}` : ""}
                  </p>
                  {rows.length === 0 ? (
                    <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                      Nenhum registro encontrado.
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      {rows.map((row) => (
                        <article
                          key={row.id}
                          className="rounded-2xl border border-border bg-card p-5"
                        >
                          <h2 className="m-0 text-base font-semibold">
                            {row.href ? (
                              <Link href={row.href} className="hover:underline">
                                {row.title}
                              </Link>
                            ) : (
                              row.title
                            )}
                          </h2>
                          {row.subtitle && (
                            <p className="mb-0 mt-1 text-sm text-muted-foreground">
                              {row.subtitle}
                            </p>
                          )}
                          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                            {row.fields.map(([label, field], index) => (
                              <div key={`${label}-${index}`}>
                                <dt className="text-muted-foreground">{label ?? ""}</dt>
                                <dd className="mt-1 break-words font-medium">{field ?? ""}</dd>
                              </div>
                            ))}
                          </dl>
                        </article>
                      ))}
                    </div>
                  )}
                  {section === "auditLog" && total > 20 && (
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
            </>
          )
        )}
      </div>
    </Layout>
  );
}
