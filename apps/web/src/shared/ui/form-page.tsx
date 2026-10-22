"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from "react";
import { PageHeader, type PageHeaderProps } from "@/shared/ui/data-list";
import { StatusMessage, type Status } from "@/shared/ui/form-primitives";
import { Button } from "@/shared/ui/kit/button";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { cn } from "@/shared/ui/kit/utils";

// ─── Page ────────────────────────────────────────────────────────────────────

interface FormPageProps extends PageHeaderProps {
  /** Coluna de 960px para páginas com tabelas ou painéis auxiliares; o padrão é 720px. */
  wide?: boolean;
  loading?: boolean;
  /** Falha ao carregar os dados do formulário; substitui o conteúdo por uma tentativa nova. */
  error?: string;
  onRetry?: () => void;
  /** Aviso persistente acima do formulário (ex.: "Produto atualizado."). */
  notice?: Status;
  children?: ReactNode;
}

/** Casca das páginas de cadastro e edição: cabeçalho, coluna central e estados de carga. */
export function FormPage({
  wide = false,
  loading = false,
  error,
  onRetry,
  notice,
  children,
  ...header
}: FormPageProps) {
  return (
    <div className={cn("mx-auto w-full", wide ? "max-w-[960px]" : "max-w-[720px]")}>
      <PageHeader {...header} />
      {notice && (
        <div className="mb-6">
          <StatusMessage status={notice} />
        </div>
      )}
      {loading ? (
        <FormSkeleton />
      ) : error ? (
        <FormLoadError message={error} onRetry={onRetry} />
      ) : (
        children
      )}
    </div>
  );
}

function FormSkeleton() {
  return (
    <div role="status" aria-label="Carregando" className="grid gap-9">
      {[4, 2].map((fields, section) => (
        <div key={section} className="grid gap-3">
          <Skeleton className="ml-1 h-4 w-36" />
          <div className="grid gap-5 rounded-2xl border border-border bg-card p-5 md:grid-cols-2 md:p-6">
            {Array.from({ length: fields }, (_, i) => (
              <div key={i} className="grid gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-full rounded-[10px]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FormLoadError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="grid justify-items-center gap-1 rounded-2xl border border-border bg-card px-6 py-12 text-center"
    >
      <p className="m-0 text-[15px] font-semibold tracking-[-0.015em] text-foreground">
        Não foi possível carregar
      </p>
      <p className="m-0 max-w-sm text-[13px] text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

/** Grupo de campos: título e apoio fora do cartão, campos dentro, como nos Ajustes do macOS. */
export function FormSection({
  title,
  description,
  action,
  columns = 2,
  flush = false,
  children,
}: {
  title: string;
  description?: ReactNode;
  /** Ação à direita do título (ex.: "Adicionar"). */
  action?: ReactNode;
  columns?: 1 | 2;
  /** Sem espaçamento interno; os filhos viram linhas separadas por filetes. */
  flush?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="grid gap-3">
      <div className="flex items-end justify-between gap-4 px-1">
        <div className="min-w-0">
          <h2
            id={id}
            className="m-0 text-[15px] leading-tight font-semibold tracking-[-0.015em] text-foreground"
          >
            {title}
          </h2>
          {description && (
            <p className="m-0 mt-1 text-[13px] leading-snug text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div
        className={cn(
          "rounded-2xl border border-border bg-card",
          flush ? "divide-y divide-border overflow-hidden" : "grid gap-5 p-5 md:p-6",
          !flush && columns === 2 && "md:grid-cols-2",
        )}
      >
        {children}
      </div>
    </section>
  );
}

/** Ocupa as duas colunas de um `FormSection`. */
export const fullWidth = "md:col-span-2";

// ─── Actions ─────────────────────────────────────────────────────────────────

const subscribeNever = () => () => {};
const isApplePlatform = () => /Mac|iPhone|iPad/.test(navigator.userAgent);

/**
 * Barra de ações flutuante ao pé do formulário, sempre visível durante a rolagem.
 * ⌘↵ / Ctrl↵ envia o formulário de qualquer campo.
 */
export function FormActions({
  submitLabel,
  submittingLabel = "Salvando…",
  submitting = false,
  disabled = false,
  icon,
  onCancel,
  cancelLabel = "Cancelar",
  dirty,
  status,
}: {
  submitLabel: string;
  submittingLabel?: string;
  submitting?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  onCancel: () => void;
  cancelLabel?: string;
  /** Na edição, informa se há alterações pendentes; omita no cadastro. */
  dirty?: boolean;
  /** Erro ou confirmação da submissão, exibido acima da barra. */
  status?: Status;
}) {
  const submitRef = useRef<HTMLButtonElement>(null);
  const apple = useSyncExternalStore(subscribeNever, isApplePlatform, () => false);

  useEffect(() => {
    const submit = submitRef.current;
    const form = submit?.form;
    if (!submit || !form) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || !(event.metaKey || event.ctrlKey) || event.isComposing) return;
      event.preventDefault();
      if (!submit.disabled) form.requestSubmit(submit);
    };
    form.addEventListener("keydown", handleKey);
    return () => form.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      {status && <StatusMessage status={status} />}
      <div className="sticky bottom-3 z-20 md:bottom-4">
        <div className="flex items-center gap-2 rounded-2xl border border-ink/10 bg-[rgb(var(--surface-rgb)/0.82)] py-2 pr-2 pl-4 shadow-elevated backdrop-blur-2xl backdrop-saturate-150">
          <p className="m-0 flex min-w-0 flex-1 items-center gap-2 truncate text-[13px] text-muted-foreground">
            {dirty !== undefined && (
              <>
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    dirty ? "bg-warning" : "bg-ink/20",
                  )}
                />
                <span className="truncate">
                  {dirty ? "Alterações não salvas" : "Nenhuma alteração"}
                </span>
              </>
            )}
          </p>
          <kbd className="mr-1 hidden font-sans text-[12px] text-subtle-foreground md:inline">
            {apple ? "⌘" : "Ctrl"} ↵
          </kbd>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            {cancelLabel}
          </Button>
          <Button ref={submitRef} type="submit" disabled={submitting || disabled}>
            {submitting ? <Loader2 className="animate-spin" /> : icon}
            {submitting ? submittingLabel : submitLabel}
          </Button>
        </div>
      </div>
    </>
  );
}
