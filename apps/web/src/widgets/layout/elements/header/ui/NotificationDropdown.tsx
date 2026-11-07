"use client";

import { motion } from "framer-motion";
import { AlertTriangle, BellOff, ChevronRight, Info, OctagonAlert, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { ease2 } from "@/shared/lib/animation";
import { useEscape } from "@/shared/lib/use-escape";
import { useOutsideClick } from "@/shared/lib/use-outside-click";
import type { AlertSeverity } from "@/entities/alert";
import { formatRelativeTime } from "@/shared/lib/relative-time";
import { useAlertFeed } from "../../../model/alert-feed";
import { focusRing, glassPanel } from "@/shared/ui/glass";

const MAX_VISIBLE = 8;

const severityStyle = {
  CRITICAL: {
    icon: OctagonAlert,
    tone: "border-destructive/30 bg-destructive-soft text-destructive",
  },
  WARNING: { icon: AlertTriangle, tone: "border-warning/30 bg-warning-soft text-warning" },
  INFO: { icon: Info, tone: "border-primary/30 bg-primary-soft text-primary" },
} satisfies Record<AlertSeverity, { icon: LucideIcon; tone: string }>;

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, onClose);
  useEscape(onClose);
  const { open, openCount, loading } = useAlertFeed();

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-label="Notificações"
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.18, ease: ease2 }}
      style={{ transformOrigin: "top right" }}
      className={`z-[200] overflow-hidden max-sm:fixed max-sm:inset-x-4 max-sm:top-[calc(100%+8px)] sm:absolute sm:top-[calc(100%+10px)] sm:right-0 sm:w-[360px] rounded-3xl ${glassPanel}`}
    >
      <div className="flex items-center justify-between border-b border-ink/[0.08] px-4 py-3.5">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold tracking-[-0.02em]">Notificações</h2>
          {openCount > 0 && <span className="rounded-full bg-destructive px-2 py-0.5 text-[11.5px] font-bold text-white">
            {openCount}
          </span>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar notificações"
          className={`grid size-8 place-items-center rounded-full text-ink/60 transition-colors hover:bg-ink/[0.08] hover:text-foreground motion-reduce:transition-none ${focusRing}`}
        >
          <X size={15} aria-hidden />
        </button>
      </div>
      <div className="max-h-[300px] overflow-y-auto p-2">
        {open.length === 0 && (
          <p className="flex flex-col items-center gap-2 px-4 py-8 text-center text-[13px] text-ink/55">
            <BellOff size={20} aria-hidden />
            {loading ? "Carregando alertas…" : "Nenhum alerta em aberto"}
          </p>
        )}
        {open.slice(0, MAX_VISIBLE).map((alert, index) => {
          const { icon: Icon, tone } = severityStyle[alert.severity];
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06, duration: 0.2, ease: ease2 }}
            >
              <Link
                href={`/alerts/${encodeURIComponent(alert.id)}`}
                onClick={onClose}
                className={`flex gap-3 rounded-2xl bg-ink/[0.025] px-3 py-3 transition-colors hover:bg-ink/[0.06] motion-reduce:transition-none ${focusRing}`}
              >
                <span
                  aria-hidden
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${tone}`}
                >
                  <Icon size={16} strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="mb-0.5 block truncate text-[13.5px] font-semibold tracking-[-0.01em]">
                    {alert.title}
                  </strong>
                  <span className="block truncate text-[13px] text-ink/65">{alert.message}</span>
                  <time
                    dateTime={alert.lastSeenAt}
                    className="mt-0.5 block text-[12px] text-ink/50"
                  >
                    {formatRelativeTime(alert.lastSeenAt)}
                  </time>
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
      <div className="border-t border-ink/[0.08] p-2">
        <Link
          href="/alerts"
          onClick={onClose}
          className={`flex w-full items-center justify-center gap-1 rounded-xl py-2.5 text-[13.5px] font-semibold tracking-[-0.01em] text-primary transition-colors hover:bg-primary-soft motion-reduce:transition-none ${focusRing}`}
        >
          Ver todos os alertas
          <ChevronRight size={14} aria-hidden />
        </Link>
      </div>
    </motion.div>
  );
}
