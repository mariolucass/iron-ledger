"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useRef } from "react";
import { ease2 } from "@/shared/lib/animation";

const buttonBase =
  "inline-flex h-14 items-center justify-center gap-2 rounded-full px-8 text-[16px] tracking-[-0.015em] outline-none transition-[transform,box-shadow,background-color,border-color] duration-200 focus-visible:ring-2 focus-visible:ring-ink/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100";

/** Botão principal: pílula de alto contraste (branca no escuro, grafite no claro), no estilo Apple. */
export const whiteButtonClass = `${buttonBase} bg-foreground font-semibold text-background shadow-[0_0_0_1px_rgb(var(--ink-rgb)/0.5),0_14px_44px_rgb(var(--ink-rgb)/0.18)] hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgb(var(--ink-rgb)/0.6),0_18px_56px_rgb(var(--ink-rgb)/0.28)]`;

/** Botão secundário: pílula de vidro. */
export const glassButtonClass = `${buttonBase} border border-ink/20 bg-ink/[0.07] font-medium text-foreground backdrop-blur-xl hover:border-ink/30 hover:bg-ink/[0.13]`;

export const gradientText =
  "bg-[linear-gradient(100deg,#00e5a0_0%,#60a5fa_40%,#a78bfa_70%,#f472b6_100%)] bg-clip-text text-transparent";

export function Reveal({ children, className = "", delay = 0, y = 32 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y }}
      animate={inView || reducedMotion ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: ease2, delay }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: ReactNode; description?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-[760px] text-center md:mb-16">
      <p className="mb-4 text-[13px] font-semibold tracking-[-0.005em] text-primary">{eyebrow}</p>
      <h2 className="m-0 bg-gradient-to-b from-foreground via-foreground to-ink/60 bg-clip-text text-[clamp(2rem,4.6vw,3.5rem)] leading-[1.06] font-semibold tracking-[-0.045em] text-balance text-transparent">
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-5 max-w-[600px] text-[17px] leading-relaxed tracking-[-0.01em] text-ink/65 md:text-[18px]">{description}</p>
      )}
    </div>
  );
}

/** Pílula de vidro com ponto de status, usada nas etiquetas das seções. */
export function GlassPill({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-ink/[0.06] px-3.5 py-1.5 text-[12.5px] font-medium tracking-[-0.01em] text-ink/85 backdrop-blur-xl">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex size-2 rounded-full bg-primary" />
      </span>
      {children}
    </p>
  );
}
