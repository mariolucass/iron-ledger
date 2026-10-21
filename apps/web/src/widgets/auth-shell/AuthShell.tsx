"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ParallaxOrb, usePointerParallax } from "@/shared/ui/orbs";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * Moldura das telas de autenticação: orbes luminosos que reagem ao cursor,
 * marca no topo e um cartão de vidro central para o formulário.
 */
export function AuthShell({ children, labelledBy }: { children: ReactNode; labelledBy: string }) {
  const reducedMotion = useReducedMotion();
  const { x, y, onPointerMove, onPointerLeave } = usePointerParallax();

  return (
    <main
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="relative isolate flex min-h-svh flex-col overflow-x-hidden bg-background font-sans text-foreground"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <ParallaxOrb x={x} y={y} depth={-50} color="green" position="-top-40 -left-32 size-[520px]" opacity={0.5} motion={0} blur={90} />
        <ParallaxOrb x={x} y={y} depth={44} color="blue" position="-top-24 -right-24 size-[480px]" opacity={0.46} motion={1} blur={90} />
        <ParallaxOrb x={x} y={y} depth={-36} color="violet" position="-bottom-60 left-[26%] size-[560px]" opacity={0.46} motion={2} blur={100} />
        <ParallaxOrb x={x} y={y} depth={60} color="pink" position="-right-16 -bottom-32 size-[340px]" opacity={0.3} motion={3} blur={90} />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] bg-[size:28px_28px] opacity-25 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]" />
      </div>

      <header className="flex items-center justify-between px-5 pt-5 md:px-10 md:pt-8">
        <Link href="/" aria-label="Iron Ledger, página inicial" className={`flex items-center gap-2.5 rounded-xl py-1 pr-2 ${focusRing}`}>
          <Image src="/brand/logo-symbol-dark.svg" alt="" width={24} height={27} priority className="h-[27px] w-[24px]" />
          <span className="text-[17px] font-semibold tracking-[-0.025em] text-foreground">Iron Ledger</span>
        </Link>
        <Link
          href="/"
          className={`inline-flex h-10 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[14px] font-medium text-white/75 backdrop-blur-xl transition-colors hover:bg-white/[0.09] hover:text-foreground motion-reduce:transition-none ${focusRing}`}
        >
          <ArrowLeft size={15} aria-hidden /> Início
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-5 py-10 md:py-14">
        <motion.section
          aria-labelledby={labelledBy}
          initial={reducedMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[448px] rounded-[32px] border border-white/[0.12] bg-[rgb(14_16_18/0.72)] p-7 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.09)] backdrop-blur-2xl backdrop-saturate-150 sm:p-10"
        >
          <div aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          {children}
        </motion.section>
      </div>

      <footer className="px-5 pb-6 text-center text-[13px] text-white/45 md:pb-8">© 2026 Iron Ledger</footer>
    </main>
  );
}
