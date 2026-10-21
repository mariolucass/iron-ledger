"use client";

import { motion } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { ease2 } from "@/shared/lib/animation";
import { useEscape } from "@/shared/lib/use-escape";
import { useOutsideClick } from "@/shared/lib/use-outside-click";
import {
  mockNotifications,
  unreadNotificationsCount,
} from "../api/mock-notifications";
import type { NotificationTone } from "../model/types";
import { focusRing, glassPanel } from "./glass";

const tones = {
  destructive: "border-destructive/30 bg-destructive-soft text-destructive",
  primary: "border-primary/30 bg-primary-soft text-primary",
  warning: "border-warning/30 bg-warning-soft text-warning",
} satisfies Record<NotificationTone, string>;

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, onClose);
  useEscape(onClose);

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
      className={`absolute top-[calc(100%+10px)] right-0 z-[200] w-[min(360px,calc(100vw-28px))] overflow-hidden rounded-3xl ${glassPanel}`}
    >
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3.5">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold tracking-[-0.02em]">Notificações</h2>
          <span className="rounded-full bg-destructive px-2 py-0.5 text-[11.5px] font-bold text-white">
            {unreadNotificationsCount}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar notificações"
          className={`grid size-8 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/[0.08] hover:text-foreground motion-reduce:transition-none ${focusRing}`}
        >
          <X size={15} aria-hidden />
        </button>
      </div>
      <div className="max-h-[300px] overflow-y-auto p-2">
        {mockNotifications.map((notification, index) => {
          const Icon = notification.icon;
          return (
            <motion.article
              key={notification.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06, duration: 0.2, ease: ease2 }}
              className={`flex gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-white/[0.06] motion-reduce:transition-none ${notification.unread ? "bg-white/[0.025]" : ""}`}
            >
              <span
                aria-hidden
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${tones[notification.tone]}`}
              >
                <Icon size={16} strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="mb-0.5 flex items-center justify-between gap-1.5">
                  <strong className="text-[13.5px] font-semibold tracking-[-0.01em]">
                    {notification.title}
                  </strong>
                  {notification.unread && (
                    <span className="size-2 shrink-0 rounded-full bg-primary shadow-[0_0_10px_rgba(0,229,160,0.7)]">
                      <span className="sr-only">Não lida</span>
                    </span>
                  )}
                </span>
                <span className="block truncate text-[13px] text-white/65">{notification.body}</span>
                <time className="mt-0.5 block text-[12px] text-white/50">{notification.time}</time>
              </span>
            </motion.article>
          );
        })}
      </div>
      <div className="border-t border-white/[0.08] p-2">
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
