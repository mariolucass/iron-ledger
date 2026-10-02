"use client";

import { motion } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { ease2 } from "@/shared/lib/animation";
import { useOutsideClick } from "@/shared/lib/use-outside-click";
import {
  mockNotifications,
  unreadNotificationsCount,
} from "../api/mock-notifications";
import type { NotificationTone } from "../model/types";

const tones = {
  destructive: "border-destructive/30 bg-destructive-soft text-destructive",
  primary: "border-primary/30 bg-primary-soft text-primary",
  warning: "border-warning/30 bg-warning-soft text-warning",
} satisfies Record<NotificationTone, string>;

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, onClose);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.18, ease: ease2 }}
      className="absolute top-[calc(100%+10px)] right-0 z-[200] w-[min(340px,calc(100vw-28px))] overflow-hidden rounded-2xl border border-border-strong bg-popover shadow-elevated"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
        <div className="flex items-center gap-2">
          <h2 className="text-[13.5px] font-bold tracking-[-0.02em]">
            Notificações
          </h2>
          <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-extrabold text-white">
            {unreadNotificationsCount}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar notificações"
          className="p-0.5 text-subtle-foreground transition hover:text-foreground"
        >
          <X size={14} />
        </button>
      </div>
      <div className="max-h-[280px] overflow-y-auto">
        {mockNotifications.map((notification, index) => {
          const Icon = notification.icon;
          return (
            <motion.article
              key={notification.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06, duration: 0.2, ease: ease2 }}
              className={`flex cursor-pointer gap-3 px-4 py-3 transition hover:bg-card-hover ${index < mockNotifications.length - 1 ? "border-b border-border" : ""} ${notification.unread ? "bg-white/[0.015]" : ""}`}
            >
              <span
                className={`flex size-[34px] shrink-0 items-center justify-center rounded-[10px] border ${tones[notification.tone]}`}
              >
                <Icon size={15} strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="mb-0.5 flex items-center justify-between gap-1.5">
                  <strong className="text-[12.5px] font-bold tracking-[-0.01em]">
                    {notification.title}
                  </strong>
                  {notification.unread && (
                    <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                  )}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {notification.body}
                </span>
                <time className="mt-0.5 block text-[11px] text-subtle-foreground">
                  {notification.time}
                </time>
              </span>
            </motion.article>
          );
        })}
      </div>
      <div className="border-t border-border px-4 py-2.5">
        <Link
          href="/alerts"
          onClick={onClose}
          className="flex w-full items-center justify-center gap-1 py-1 text-[12.5px] font-semibold tracking-[-0.01em] text-primary transition hover:text-primary-hover"
        >
          Ver todos os alertas
          <ChevronRight size={12} />
        </Link>
      </div>
    </motion.div>
  );
}
