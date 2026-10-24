"use client";

import Link from "next/link";
import type { Route } from "next";
import { useCallback, useEffect, useState } from "react";
import { auditLogApi, AuditActionBadge, type AuditLog } from "@/entities/audit-log";
import {
  isTerminalStatus,
  SagaStepStatusBadge,
  sagaStepLabel,
  transactionApi,
  TransactionStatusBadge,
  transactionStatusLabel,
  type TransactionDetail,
} from "@/entities/transaction";
import { withSession } from "@/shared/auth/with-session";
import { usePolling } from "@/shared/lib/use-polling";
import { PageHeader, secondaryActionClass } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";
import { transactionHistoryPages } from "../model/pages";

type Section = "history" | "saga" | "auditLog";
const date = (input: string | null) =>
  input
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(
        new Date(input),
      )
    : "—";
const Empty = ({ message }: { message: string }) => (
  <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
    {message}
  </p>
);

export function TransactionHistoryPage({ id, section }: { id: string; section: Section }) {
  const config = transactionHistoryPages[section](id);
  const [tx, setTx] = useState<TransactionDetail | null>(null);
  const [events, setEvents] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const refresh = useCallback(async () => {
    setTx(await withSession(transactionApi.get(id)));
  }, [id]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    withSession(transactionApi.get(id))
      .then(async (detail) => {
        if (!active) return;
        if (section === "auditLog") {
          const query = detail.correlationId
            ? { correlationId: detail.correlationId, page, pageSize: 20 }
            : { entityType: "Transaction", entityId: id, page, pageSize: 20 };
          const result = await withSession(auditLogApi.list(query));
          if (!active) return;
          setEvents(result.items);
          setTotal(result.total);
        }
        setTx(detail);
        setLoading(false);
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
  }, [id, section, page, attempt]);
  usePolling(
    refresh,
    2_000,
    !loading && section !== "auditLog" && !!tx && !isTerminalStatus(tx.status),
  );

  return (
    <Layout title={config.title}>
      <div className="pb-10">
        <PageHeader
          back={{ href: `/transactions/${id}` as Route, label: tx?.code ?? "Transação" }}
          title={config.title}
          description={config.description}
          badges={tx ? <TransactionStatusBadge status={tx.status} /> : undefined}
        />
        {loading ? (
          <p role="status" className="rounded-2xl border border-border bg-card p-6">
            Carregando transação…
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
          tx && (
            <>
              {section === "history" && (
                <section aria-label="Mudanças de status">
                  {tx.history.length === 0 ? (
                    <Empty message="Nenhuma mudança de status registrada." />
                  ) : (
                    <ol className="grid gap-3">
                      {tx.history.map((change, index) => (
                        <li
                          key={`${change.changedAt}-${index}`}
                          className="rounded-2xl border border-border bg-card p-5"
                        >
                          <p className="m-0 text-sm text-muted-foreground">
                            {date(change.changedAt)}
                          </p>
                          <p className="mb-0 mt-2 font-semibold">
                            {change.fromStatus
                              ? transactionStatusLabel(change.fromStatus)
                              : "Início"}{" "}
                            → {transactionStatusLabel(change.toStatus)}
                          </p>
                          {change.reason && (
                            <p className="mb-0 mt-2 text-sm">Motivo: {change.reason}</p>
                          )}
                          <p className="mb-0 mt-2 text-xs text-muted-foreground">
                            Responsável: {change.changedBy ?? "Sistema"}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              )}
              {section === "saga" && (
                <section aria-label="Etapas da saga">
                  <p className="mb-4 break-all text-sm text-muted-foreground">
                    Workflow: {tx.workflowId} · Run: {tx.workflowRunId ?? "—"}
                  </p>
                  {tx.steps.length === 0 ? (
                    <Empty
                      message={
                        isTerminalStatus(tx.status)
                          ? "Nenhuma etapa registrada."
                          : "Aguardando o início da saga."
                      }
                    />
                  ) : (
                    <ol className="grid gap-3">
                      {tx.steps.map((step) => (
                        <li key={step.id} className="rounded-2xl border border-border bg-card p-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">
                              {step.sequence}. {sagaStepLabel(step.name)}
                            </span>
                            <SagaStepStatusBadge status={step.status} />
                          </div>
                          <p className="mb-0 mt-1 text-sm text-muted-foreground">
                            {step.kind === "COMPENSATION" ? "Compensação" : "Ação"} · Tentativa{" "}
                            {step.attempt}
                          </p>
                          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                            <div>
                              <dt className="text-muted-foreground">Início</dt>
                              <dd>{date(step.startedAt)}</dd>
                            </div>
                            <div>
                              <dt className="text-muted-foreground">Fim</dt>
                              <dd>{date(step.finishedAt)}</dd>
                            </div>
                          </dl>
                          {step.error && (
                            <p className="mb-0 mt-3 break-words text-sm text-destructive">
                              Erro: {step.error}
                            </p>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              )}
              {section === "auditLog" && (
                <section aria-label="Eventos de auditoria">
                  <p className="mb-4 break-all text-sm text-muted-foreground">
                    {tx.correlationId
                      ? `Correlação: ${tx.correlationId}`
                      : "Eventos associados à transação"}{" "}
                    · {total} {total === 1 ? "evento" : "eventos"}
                  </p>
                  {events.length === 0 ? (
                    <Empty message="Nenhum evento de auditoria encontrado." />
                  ) : (
                    <ol className="grid gap-3">
                      {events.map((event) => (
                        <li key={event.id} className="rounded-2xl border border-border bg-card p-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{event.eventName}</span>
                            <AuditActionBadge action={event.action} />
                          </div>
                          <p className="mb-0 mt-2 text-sm text-muted-foreground">
                            {date(event.occurredAt)} · {event.actorEmail ?? "Sistema"}
                          </p>
                          <p className="mb-0 mt-2 break-all font-mono text-xs text-muted-foreground">
                            {event.entityType} · {event.entityId}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                  {total > 20 && (
                    <nav
                      aria-label="Paginação da auditoria"
                      className="mt-5 flex items-center gap-3"
                    >
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
                </section>
              )}
              <nav aria-label="Outras páginas da transação" className="mt-6 flex flex-wrap gap-2">
                {(["history", "saga", "auditLog"] as const)
                  .filter((item) => item !== section)
                  .map((item) => (
                    <Link
                      key={item}
                      href={
                        `/transactions/${id}/${item === "auditLog" ? "audit-log" : item}` as Route
                      }
                      className={secondaryActionClass}
                    >
                      {transactionHistoryPages[item](id).title}
                    </Link>
                  ))}
              </nav>
            </>
          )
        )}
      </div>
    </Layout>
  );
}
