"use client";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import {
  platformApi,
  type PlatformOverview,
  type OutboxRow,
  type InboxRow,
  type IdempotencyRow,
  type SystemSetting,
  type FeatureFlag,
  type OutboxDetail,
  type PlatformServices,
  type ServiceHealth,
} from "@/entities/platform";
import { withSession } from "@/shared/auth/with-session";
import { PageHeader, primaryActionClass, secondaryActionClass } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";

type Section =
  | "overview"
  | "outbox"
  | "outboxDetail"
  | "inbox"
  | "idempotency"
  | "settings"
  | "flags"
  | "flagDetail";
type Row = { id: string; title: string; subtitle?: string; fields: string[][]; href?: Route };
const date = (input: string | null) =>
  input
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
        new Date(input),
      )
    : "—";
const config: Record<Section, [string, string]> = {
  overview: [
    "Plataforma",
    "Saúde dos serviços que sustentam o Iron Ledger e registros persistidos da plataforma.",
  ],
  outbox: ["Eventos publicados", "Estado de publicação dos eventos do outbox."],
  outboxDetail: ["Evento do outbox", "Detalhes de publicação e conteúdo do evento."],
  inbox: ["Mensagens recebidas", "Mensagens processadas pelos consumidores."],
  idempotency: ["Chaves de idempotência", "Requisições deduplicadas e validade dos registros."],
  settings: [
    "Parâmetros do sistema",
    "Valores não secretos dos escopos sistema, armazém e usuário.",
  ],
  flags: ["Feature flags", "Estado, percentual de rollout e regras das flags."],
  flagDetail: ["Feature flag", "Estado e regras da flag."],
};
const links: [string, string][] = [
  ["feature-flags", "Feature flags"],
  ["settings", "Parâmetros"],
  ["outbox", "Outbox"],
  ["inbox", "Inbox"],
  ["idempotency-keys", "Idempotência"],
];
const health: Record<ServiceHealth, { label: string; bg: string; text: string }> = {
  up: { label: "Operando", bg: "var(--primary-soft)", text: "var(--primary)" },
  degraded: { label: "Degradado", bg: "var(--warning-soft)", text: "var(--warning)" },
  down: { label: "Indisponível", bg: "var(--destructive-soft)", text: "var(--destructive)" },
  disabled: { label: "Desativado", bg: "var(--muted)", text: "var(--muted-foreground)" },
};
function ServicesPanel() {
  const [data, setData] = useState<PlatformServices | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setChecking(true);
    withSession(platformApi.services())
      .then((result) => {
        if (active) {
          setData(result);
          setError(null);
        }
      })
      .catch((reason) => {
        if (active)
          setError(
            reason instanceof Error ? reason.message : "Não foi possível verificar os serviços.",
          );
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  const services = data?.services ?? [];
  const operating = services.filter((item) => item.status === "up").length;
  return (
    <section aria-labelledby="platform-services" className="mb-5" aria-busy={checking}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="platform-services" className="m-0 font-semibold">
            Serviços
          </h2>
          <p className="mb-0 mt-1 text-sm text-muted-foreground">
            {checking && !data
              ? "Verificando dependências…"
              : data
                ? `${operating} de ${services.length} operando · verificado às ${new Intl.DateTimeFormat("pt-BR", { timeStyle: "medium" }).format(new Date(data.checkedAt))}`
                : "Estado dos serviços indisponível."}
          </p>
        </div>
        <button
          type="button"
          className={secondaryActionClass}
          disabled={checking}
          onClick={() => setAttempt((value) => value + 1)}
        >
          {checking ? "Verificando…" : "Verificar novamente"}
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded-2xl border border-border bg-card p-5 text-sm">
          {error}
        </p>
      )}
      {services.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {services.map((item) => {
            const tone = health[item.status];
            return (
              <article key={item.key} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="m-0 text-base font-semibold">
                    {item.name}
                    {item.optional && (
                      <span className="ml-2 align-middle text-xs font-normal text-muted-foreground">
                        opcional
                      </span>
                    )}
                  </h3>
                  <span
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.05em]"
                    style={{ background: tone.bg, color: tone.text }}
                  >
                    <span
                      aria-hidden
                      className="inline-block size-1.5 rounded-full"
                      style={{ background: tone.text }}
                    />
                    {tone.label}
                  </span>
                </div>
                <p className="mb-0 mt-1 text-sm text-muted-foreground">{item.role}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {item.details.map((detail) => (
                    <div key={detail.label}>
                      <dt className="text-muted-foreground">{detail.label}</dt>
                      <dd className="mt-1 break-words font-medium">{detail.value}</dd>
                    </div>
                  ))}
                  {item.latencyMs != null && (
                    <div>
                      <dt className="text-muted-foreground">Latência</dt>
                      <dd className="mt-1 font-medium">{item.latencyMs} ms</dd>
                    </div>
                  )}
                </dl>
                {item.error && (
                  <p className="mb-0 mt-3 break-words text-sm" style={{ color: tone.text }}>
                    {item.error}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
async function load(
  section: Section,
  page: number,
  id?: string,
): Promise<{ rows: Row[]; total: number; overview?: PlatformOverview; detail?: OutboxDetail }> {
  switch (section) {
    case "overview":
      return { rows: [], total: 0, overview: await platformApi.overview() };
    case "outbox": {
      const result = await platformApi.outbox(page);
      return {
        total: result.total,
        rows: result.items.map((item: OutboxRow) => ({
          id: item.id,
          title: item.eventName,
          subtitle: `${item.aggregateType} · ${item.aggregateId}`,
          href: `/system/outbox/${item.id}` as Route,
          fields: [
            ["Estado", item.status],
            ["Tentativas", String(item.attempts)],
            ["Ocorrido", date(item.occurredAt)],
            ["Publicado", date(item.publishedAt)],
            ["Último erro", item.lastError ?? "—"],
          ],
        })),
      };
    }
    case "outboxDetail": {
      if (!id) throw new Error("Evento não informado.");
      const item = await platformApi.outboxDetail(id);
      return {
        total: 1,
        detail: item,
        rows: [
          {
            id: item.id,
            title: item.eventName,
            subtitle: `${item.aggregateType} · ${item.aggregateId}`,
            fields: [
              ["Sequência", item.sequence],
              ["Estado", item.status],
              ["Tentativas", String(item.attempts)],
              ["Exchange", item.exchange],
              ["Routing key", item.routingKey],
              ["Correlação", item.correlationId ?? "—"],
              ["Ocorrido", date(item.occurredAt)],
              ["Disponível", date(item.availableAt)],
              ["Publicado", date(item.publishedAt)],
              ["Último erro", item.lastError ?? "—"],
            ],
          },
        ],
      };
    }
    case "inbox": {
      const result = await platformApi.inbox(page);
      return {
        total: result.total,
        rows: result.items.map((item: InboxRow) => ({
          id: item.id,
          title: item.eventName,
          subtitle: item.consumer,
          fields: [
            ["Mensagem", item.messageId],
            ["Estado", item.status],
            ["Tentativas", String(item.attempts)],
            ["Recebida", date(item.receivedAt)],
            ["Processada", date(item.processedAt)],
            ["Último erro", item.lastError ?? "—"],
          ],
        })),
      };
    }
    case "idempotency": {
      const result = await platformApi.idempotencyKeys(page);
      return {
        total: result.total,
        rows: result.items.map((item: IdempotencyRow) => ({
          id: item.id,
          title: item.key,
          fields: [
            ["Escopo", item.scope],
            ["Estado", item.status],
            ["HTTP", item.responseStatus?.toString() ?? "—"],
            ["Criada", date(item.createdAt)],
            ["Expira", date(item.expiresAt)],
          ],
        })),
      };
    }
    case "settings": {
      const result = await platformApi.settings(page);
      return {
        total: result.total,
        rows: result.items.map((item: SystemSetting) => ({
          id: item.id,
          title: item.key,
          subtitle: item.description ?? undefined,
          fields: [
            ["Escopo", item.scope],
            ["ID do escopo", item.scopeId ?? "—"],
            ["Valor", JSON.stringify(item.value) ?? "—"],
            ["Versão", String(item.version)],
            ["Atualizado", date(item.updatedAt)],
          ],
        })),
      };
    }
    case "flags": {
      const result = await platformApi.flags(page);
      return {
        total: result.total,
        rows: result.items.map((item: FeatureFlag) => ({
          id: item.id,
          title: item.key,
          subtitle: item.description ?? undefined,
          href: `/system/feature-flags/${item.id}` as Route,
          fields: [
            ["Estado", item.isEnabled ? "Ativada" : "Desativada"],
            ["Rollout", `${item.rollout}%`],
            ["Atualizada", date(item.updatedAt)],
          ],
        })),
      };
    }
    case "flagDetail": {
      if (!id) throw new Error("Flag não informada.");
      const item = await platformApi.flag(id);
      return {
        total: 1,
        rows: [
          {
            id: item.id,
            title: item.key,
            subtitle: item.description ?? undefined,
            fields: [
              ["Estado", item.isEnabled ? "Ativada" : "Desativada"],
              ["Rollout", `${item.rollout}%`],
              ["Regras", item.rules == null ? "Nenhuma" : (JSON.stringify(item.rules) ?? "—")],
              ["Atualizada", date(item.updatedAt)],
            ],
          },
        ],
      };
    }
  }
}
export function PlatformPage({ section, id }: { section: Section; id?: string }) {
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [detail, setDetail] = useState<OutboxDetail | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    withSession(load(section, page, id))
      .then((result) => {
        if (active) {
          setRows(result.rows);
          setTotal(result.total);
          setOverview(result.overview ?? null);
          setDetail(result.detail ?? null);
          setLoading(false);
        }
      })
      .catch((reason) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : "Não foi possível carregar os dados.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [section, id, page, attempt]);
  const [title, description] = config[section];
  const parent =
    section === "outboxDetail"
      ? "/system/outbox"
      : section === "flagDetail"
        ? "/system/feature-flags"
        : "/system";
  return (
    <Layout title={title}>
      <div className="pb-10">
        <PageHeader
          back={
            section === "overview"
              ? undefined
              : { href: parent as Route, label: parent === "/system" ? "Plataforma" : "Voltar" }
          }
          title={title}
          description={description}
          actions={
            section === "flags" ? (
              <Link href="/system/feature-flags/new" className={primaryActionClass}>
                Nova flag
              </Link>
            ) : section === "flagDetail" && id ? (
              <Link
                href={`/system/feature-flags/${id}/edit` as Route}
                className={primaryActionClass}
              >
                Editar flag
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
            {section === "overview" && overview && (
              <>
                <ServicesPanel />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Feature flags", overview.featureFlags],
                    ["Parâmetros visíveis", overview.visibleSettings],
                    ["Chaves de idempotência", overview.idempotencyKeys],
                    [
                      "Eventos no outbox",
                      Object.values(overview.outbox).reduce((a, b) => a + b, 0),
                    ],
                  ].map(([label, count]) => (
                    <div key={label} className="rounded-2xl border border-border bg-card p-5">
                      <p className="m-0 text-sm text-muted-foreground">{label}</p>
                      <p className="mb-0 mt-2 text-2xl font-semibold">{count}</p>
                    </div>
                  ))}
                </div>
                <section className="mt-5 rounded-2xl border border-border bg-card p-5">
                  <h2 className="m-0 font-semibold">Estados da mensageria</h2>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium">Outbox</h3>
                      <p className="text-sm text-muted-foreground">
                        {Object.entries(overview.outbox)
                          .map(([status, count]) => `${status}: ${count}`)
                          .join(" · ") || "Nenhum evento"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Inbox</h3>
                      <p className="text-sm text-muted-foreground">
                        {Object.entries(overview.inbox)
                          .map(([status, count]) => `${status}: ${count}`)
                          .join(" · ") || "Nenhuma mensagem"}
                      </p>
                    </div>
                  </div>
                </section>
                <nav aria-label="Explorar plataforma" className="mt-5 flex flex-wrap gap-2">
                  {links.map(([path, label]) => (
                    <Link
                      key={path}
                      href={`/system/${path}` as Route}
                      className={secondaryActionClass}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
              </>
            )}
            {section !== "overview" && (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  {total} {total === 1 ? "registro" : "registros"}
                </p>
                {rows.length ? (
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
                          <p className="mb-0 mt-1 break-all text-sm text-muted-foreground">
                            {row.subtitle}
                          </p>
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
                {detail && (
                  <section className="mt-5 grid gap-4">
                    <h2 className="text-base font-semibold">Conteúdo do evento</h2>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <h3 className="text-sm font-medium">Payload</h3>
                        <pre className="overflow-x-auto rounded-2xl border border-border bg-card p-4 text-xs">
                          {JSON.stringify(detail.payload, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Cabeçalhos</h3>
                        <pre className="overflow-x-auto rounded-2xl border border-border bg-card p-4 text-xs">
                          {JSON.stringify(detail.headers, null, 2) ?? "—"}
                        </pre>
                      </div>
                    </div>
                  </section>
                )}
                {!["outboxDetail", "flagDetail"].includes(section) && total > 20 && (
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
        )}
      </div>
    </Layout>
  );
}
