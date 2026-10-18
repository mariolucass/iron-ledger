"use client";

import { motion, useInView } from "framer-motion";
import type { ReactNode } from "react";
import { useRef } from "react";
import { ease2 } from "@/shared/lib/animation";

export const primaryButtonClass = "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary-hover px-7 py-3.5 text-[15px] font-bold tracking-[-0.02em] text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,229,160,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0";
export const ghostButtonClass = "inline-flex items-center justify-center gap-2 rounded-full border border-border-strong bg-transparent px-7 py-3.5 text-[15px] font-semibold tracking-[-0.02em] text-foreground transition hover:border-primary hover:bg-primary-glow hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function Reveal({ children, className = "", delay = 0, y = 40 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return <motion.div ref={ref} className={className} initial={{ opacity: 0, y }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease: ease2, delay }}>{children}</motion.div>;
}

export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: ReactNode; description?: string }) {
  return <div className="mx-auto mb-14 max-w-2xl text-center md:mb-16">
    <p className="mb-3 text-[11px] font-bold tracking-[0.12em] text-primary uppercase">{eyebrow}</p>
    <h2 className="text-[clamp(1.75rem,4vw,3rem)] leading-[1.1] font-extrabold tracking-[-0.04em] text-foreground">{title}</h2>
    {description && <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground md:text-base">{description}</p>}
  </div>;
}
