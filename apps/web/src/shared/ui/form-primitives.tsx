"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useId, type ReactNode } from "react";
import { cn } from "@/shared/ui/kit/utils";

/** 16px no celular evita o zoom automático do iOS ao focar o campo. */
export const inputClass =
  "h-10 w-full rounded-[10px] border border-border bg-input-background px-3 text-[16px] tracking-[-0.005em] text-foreground shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-subtle-foreground hover:border-border-strong focus:border-primary/70 focus:ring-[3px] focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive/70 aria-invalid:focus:ring-destructive/15 motion-reduce:transition-none md:text-[14px]";

export const textareaClass = cn(inputClass, "h-auto min-h-24 resize-y py-2.5 leading-relaxed");

/** Gatilho do Select (Radix) alinhado à altura e ao raio dos campos nativos. */
export const selectTriggerClass =
  "w-full rounded-[10px] px-3 text-[16px] data-[size=default]:h-10 md:text-[14px]";

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
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
  }) => ReactNode;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="grid gap-2">
      <label
        htmlFor={id}
        className="text-[13px] leading-none font-medium tracking-[-0.005em] text-ink/75"
      >
        {label}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {error ? (
        <p id={`${id}-error`} className="m-0 text-[12.5px] text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="m-0 text-[12.5px] text-muted-foreground">
          {hint}
        </p>
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
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] leading-normal ${isError ? "border-destructive/30 bg-destructive-soft text-destructive" : "border-primary/25 bg-primary-soft text-primary"}`}
    >
      {isError ? (
        <AlertTriangle className="mt-px shrink-0" size={15} />
      ) : (
        <CheckCircle2 className="mt-px shrink-0" size={15} />
      )}
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
  bare = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  badge?: string;
  /** Sem moldura própria, para uso dentro de um `FormSection`. */
  bare?: boolean;
}) {
  const id = useId();
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        !bare && "rounded-xl border border-border bg-card p-4",
      )}
    >
      <div className="min-w-0">
        <div
          id={`${id}-label`}
          className="flex items-center gap-2 text-[14px] font-medium tracking-[-0.01em] text-foreground"
        >
          {label}
          {badge && (
            <span className="rounded-md bg-card-hover px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <div id={`${id}-desc`} className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
            {description}
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-[26px] w-[44px] shrink-0 cursor-pointer items-center rounded-full p-[2px] outline-none transition-colors duration-200 focus-visible:ring-[3px] focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
          checked ? "bg-primary" : "bg-switch-background",
        )}
      >
        <span
          className={cn(
            "size-[22px] rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.3)] transition-transform duration-200 motion-reduce:transition-none",
            checked && "translate-x-[18px]",
          )}
        />
      </button>
    </div>
  );
}
