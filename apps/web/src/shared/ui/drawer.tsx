"use client";

import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { useEscape } from "@/shared/lib/use-escape";

/**
 * Gaveta lateral de vidro. Renderize dentro de `<AnimatePresence>` para animar a saída.
 * Esc e clique no fundo fecham; a rolagem da página fica travada enquanto está aberta.
 */
export function Drawer({
  eyebrow,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEscape(onClose);

  useEffect(() => {
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[300] flex justify-end">
      <motion.div
        aria-hidden
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
      />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={reducedMotion ? { opacity: 0 } : { x: "100%" }}
        animate={reducedMotion ? { opacity: 1 } : { x: 0 }}
        exit={reducedMotion ? { opacity: 0 } : { x: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 38 }}
        className="relative flex h-full w-full max-w-[480px] flex-col gap-7 overflow-y-auto border-l border-white/[0.12] bg-[rgb(14_16_18/0.9)] p-7 shadow-[-30px_0_80px_rgba(0,0,0,0.55),inset_1px_0_0_rgba(255,255,255,0.07)] backdrop-blur-2xl backdrop-saturate-150 md:p-8"
      >
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {eyebrow && <p className="m-0 mb-2 text-[13px] font-medium text-primary">{eyebrow}</p>}
            <h2 id={titleId} className="m-0 text-[22px] leading-tight font-semibold tracking-[-0.03em] text-foreground">{title}</h2>
            {subtitle && <div className="mt-1.5 text-[14px] text-white/60">{subtitle}</div>}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border border-white/10 bg-white/[0.05] text-white/70 outline-none transition-colors hover:bg-white/[0.1] hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60 motion-reduce:transition-none"
          >
            <X size={18} aria-hidden />
          </button>
        </header>
        <div className="grid flex-1 content-start gap-7">{children}</div>
        {footer}
      </motion.aside>
    </div>
  );
}
