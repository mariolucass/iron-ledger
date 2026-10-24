"use client";

import { CheckCircle, ChevronDown, ChevronUp, Clock, Info } from "lucide-react";
import { useState } from "react";
import type { SystemAlert } from "../../model/types";
import { severityConfig, sourceConfig, statusConfig } from "../config";

interface AlertCardProps {
  alert: SystemAlert;
  disabled?: boolean;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}

export function AlertCard({ alert, disabled = false, onAcknowledge, onResolve }: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const severity = severityConfig[alert.severity];
  const source = sourceConfig[alert.source];
  const status = statusConfig[alert.status];
  const SeverityIcon = severity.icon;
  const SourceIcon = source.icon;
  const resolved = alert.status === "RESOLVED";

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-l-4 transition-opacity ${resolved ? "border-border border-l-subtle-foreground bg-sunken opacity-65" : `border-border-strong bg-card ${severity.border}`}`}
    >
      <div className="flex items-start gap-4 p-4 sm:p-6 max-sm:flex-wrap">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${resolved ? "bg-card" : severity.soft}`}
        >
          <SeverityIcon className={resolved ? "text-subtle-foreground" : severity.text} size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
            <h2
              className={`text-[14.5px] font-bold tracking-[-0.02em] ${resolved ? "text-muted-foreground" : "text-foreground"}`}
            >
              {alert.title}
            </h2>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-[0.06em] ${severity.soft} ${severity.text}`}
            >
              {alert.severity}
            </span>
            <span
              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.05em] ${status.classes}`}
            >
              {status.label}
            </span>
          </div>
          <p className="mb-4 max-w-[65ch] text-[13.5px] leading-relaxed text-muted-foreground">
            {alert.description}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
            <span className="flex items-center gap-1 rounded-md border border-border bg-card-elevated px-2.5 py-1 text-[11.5px]">
              <SourceIcon size={11} />
              {source.label}
            </span>
            {alert.affectedEntity && (
              <span className="rounded-md border border-border bg-card-elevated px-2.5 py-1 font-mono text-[11px]">
                {alert.affectedEntity}
              </span>
            )}
            <span className="flex items-center gap-1 text-[11.5px] text-subtle-foreground">
              <Clock size={11} />
              {alert.timestamp}
            </span>
            <span className="ml-auto font-mono text-[10.5px] text-subtle-foreground">
              {alert.id}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 max-sm:ml-auto">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-label={expanded ? "Recolher detalhes" : "Ver detalhes"}
            className="flex size-8 items-center justify-center rounded-lg border border-border bg-card-elevated text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {!resolved && (
            <div className="flex gap-1.5">
              {alert.status === "ACTIVE" && (
                <button
                  type="button"
                  onClick={() => onAcknowledge(alert.id)}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-warning hover:text-warning"
                >
                  <Info size={13} />
                  Reconhecer
                </button>
              )}
              <button
                type="button"
                onClick={() => onResolve(alert.id)}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary"
              >
                <CheckCircle size={13} />
                Resolver
              </button>
            </div>
          )}
        </div>
      </div>
      {expanded && (
        <div className="animate-in fade-in slide-in-from-top-1 border-t border-border bg-sunken px-4 py-6 sm:pr-6 sm:pl-[84px]">
          <h3 className="mb-2.5 text-[11px] font-semibold tracking-[0.08em] text-subtle-foreground uppercase">
            Diagnóstico completo
          </h3>
          <p className="max-w-[65ch] text-[13px] leading-[1.7] text-muted-foreground">
            {alert.detail}
          </p>
          <code className="mt-3.5 inline-block rounded-md border border-border bg-card px-2.5 py-1 text-[11px] text-subtle-foreground">
            {alert.ts_iso}
          </code>
        </div>
      )}
    </article>
  );
}
