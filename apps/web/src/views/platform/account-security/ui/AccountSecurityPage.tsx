"use client";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import {
  userApi,
  type UserApiKeyInfo,
  type UserSecurityInfo,
  type UserSessionInfo,
} from "@/entities/user";
import { withSession } from "@/shared/auth/with-session";
import { PageHeader, secondaryActionClass } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";
import { accountSecurityPages } from "../model/pages";
type Section = "sessions" | "mfa" | "connectedAccounts" | "apiKeys";
type Row = { id: string; title: string; subtitle?: string; fields: string[][] };
const date = (input: string | null) =>
  input
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
        new Date(input),
      )
    : "—";
async function load(section: Section): Promise<Row[]> {
  if (section === "sessions") {
    const items = await userApi.mySessions();
    return items.map((item: UserSessionInfo) => ({
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
    }));
  }
  if (section === "apiKeys") {
    const items = await userApi.myApiKeys();
    return items.map((item: UserApiKeyInfo) => ({
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
    }));
  }
  const info: UserSecurityInfo = await userApi.mySecurity();
  return section === "mfa"
    ? [
        {
          id: "state",
          title: "Estado do MFA",
          fields: [["Autenticação multifator", info.mfaEnabled ? "Ativada" : "Desativada"]],
        },
        ...info.factors.map((item) => ({
          id: item.id,
          title: item.label ?? item.method,
          subtitle: item.method,
          fields: [
            ["Verificado", date(item.verifiedAt)],
            ["Último uso", date(item.lastUsedAt)],
            ["Criado", date(item.createdAt)],
          ],
        })),
      ]
    : info.identities.map((item) => ({
        id: item.id,
        title: item.provider,
        subtitle: item.email ?? item.providerKey,
        fields: [
          ["Último acesso", date(item.lastLoginAt)],
          ["Vinculada", date(item.createdAt)],
        ],
      }));
}
export function AccountSecurityPage({ section }: { section: Section }) {
  const config = accountSecurityPages[section];
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    withSession(load(section))
      .then((result) => {
        if (active) {
          setRows(result);
          setLoading(false);
        }
      })
      .catch((reason) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar os dados da conta.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [section, attempt]);
  return (
    <Layout title={config.title}>
      <div className="pb-10">
        <PageHeader
          back={{ href: "/settings", label: "Configurações" }}
          title={config.title}
          description={config.description}
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
            {rows.length ? (
              <div className="grid gap-3">
                {rows.map((row) => (
                  <article key={row.id} className="rounded-2xl border border-border bg-card p-5">
                    <h2 className="m-0 text-base font-semibold">{row.title}</h2>
                    {row.subtitle && (
                      <p className="mb-0 mt-1 text-sm text-muted-foreground">{row.subtitle}</p>
                    )}
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      {row.fields.map(([label, field], index) => (
                        <div key={`${label}-${index}`}>
                          <dt className="text-muted-foreground">{label}</dt>
                          <dd className="mt-1 break-words font-medium">{field}</dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                Nenhum registro encontrado.
              </p>
            )}
            <nav aria-label="Segurança da conta" className="mt-5 flex flex-wrap gap-2">
              {[
                ["sessions", "Sessões"],
                ["mfa", "MFA"],
                ["connected-accounts", "Contas conectadas"],
                ["api-keys", "Chaves de API"],
              ].map(([path, label]) => (
                <Link
                  key={path}
                  href={`/settings/${path}` as Route}
                  className={secondaryActionClass}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </>
        )}
      </div>
    </Layout>
  );
}
