"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useId, type ReactNode } from "react";

export const inputClass =
  "h-11 w-full rounded-lg border border-border bg-input-background px-3.5 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary/70 focus:shadow-[0_0_0_3px_rgba(0,229,160,0.12)] disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive/70";

export type Status = { type: "success" | "error"; message: string } | null;

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mt-0 mb-6 text-lg font-bold text-foreground">{title}</h2>
      {children}
    </div>
  );
}

export function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="mt-8 mb-4 text-sm font-semibold text-foreground">{children}</h3>;
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {error ? (
        <p id={`${id}-error`} className="m-0 text-[13px] text-destructive">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="m-0 text-[13px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function StatusMessage({ status }: { status: Status }) {
  if (!status) return null;
  const isError = status.type === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-[13px] leading-normal ${isError ? "border-destructive/35 bg-destructive-soft text-destructive" : "border-primary/30 bg-primary-soft text-primary"}`}
    >
      {isError ? <AlertTriangle className="mt-px shrink-0" size={15} /> : <CheckCircle2 className="mt-px shrink-0" size={15} />}
      <span>{status.message}</span>
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  badge,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  badge?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-4">
      <div className="min-w-0">
        <div id={`${id}-label`} className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
          {label}
          {badge && (
            <span className="rounded bg-card-hover px-1.5 py-0.5 text-xs font-medium text-muted-foreground">{badge}</span>
          )}
        </div>
        {description && <div id={`${id}-desc`} className="text-[13px] leading-normal text-muted-foreground">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "border-primary bg-primary-soft" : "border-border bg-card"}`}
      >
        <span
          className={`absolute top-0.5 size-[18px] rounded-full transition-all ${checked ? "left-[22px] bg-primary" : "left-0.5 bg-muted-foreground"}`}
        />
      </button>
    </div>
  );
}
