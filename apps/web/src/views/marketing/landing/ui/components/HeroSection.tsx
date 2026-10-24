"use client";

import { motion, useReducedMotion, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { staggerContainer, staggerItem } from "@/shared/lib/animation";
import { GlassPill, gradientText, glassButtonClass, whiteButtonClass } from "./LandingPrimitives";
import { ParallaxOrb, usePointerParallax } from "@/shared/ui/orbs";
import { OverviewPanel } from "./ShowcasePanels";
import { WindowFrame } from "./WindowFrame";

export function HeroSection() {
  const reducedMotion = useReducedMotion();
  const { x, y, onPointerMove, onPointerLeave } = usePointerParallax();
  // A janela inclina alguns graus na direção do cursor.
  const rotateY = useTransform(x, (value) => (reducedMotion ? 0 : value * 7));
  const rotateX = useTransform(y, (value) => (reducedMotion ? 0 : value * -5));

  return (
    <section
      id="top"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="relative isolate z-10 overflow-hidden px-5 pt-32 pb-16 md:px-10 md:pt-44 md:pb-24"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <ParallaxOrb x={x} y={y} depth={-50} color="green" position="-top-40 left-[4%] size-[520px]" opacity={0.42} motion={0} blur={90} />
        <ParallaxOrb x={x} y={y} depth={44} color="blue" position="-top-24 right-[2%] size-[480px]" opacity={0.4} motion={1} blur={90} />
        <ParallaxOrb x={x} y={y} depth={-36} color="violet" position="top-[42%] left-[30%] size-[560px]" opacity={0.36} motion={2} blur={100} />
        <ParallaxOrb x={x} y={y} depth={60} color="pink" position="top-[55%] -right-16 size-[360px]" opacity={0.28} motion={3} blur={90} />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] bg-[size:28px_28px] opacity-25 [mask-image:radial-gradient(ellipse_at_50%_30%,black_10%,transparent_65%)]" />
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mx-auto w-full max-w-[980px] text-center">
        <motion.div variants={staggerItem} className="mb-8 flex justify-center">
          <GlassPill>Estoque, transações e auditoria</GlassPill>
        </motion.div>

        <motion.h1
          variants={staggerItem}
          className="m-0 mb-7 text-[clamp(2.75rem,7.4vw,5.75rem)] leading-[1.02] font-semibold tracking-[-0.055em] text-balance text-white"
        >
          O estoque que você
          <br />
          consegue <span className={`${gradientText} pb-[0.08em]`}>explicar.</span>
        </motion.h1>

        <motion.p
          variants={staggerItem}
          className="mx-auto mb-10 max-w-[640px] text-[clamp(1.0625rem,2vw,1.3125rem)] leading-relaxed tracking-[-0.012em] text-white/70"
        >
          Movimentações, reservas e transações coordenadas, com o histórico de quem fez o quê e quando. Do cadastro do produto à conferência do saldo.
        </motion.p>

        <motion.div variants={staggerItem} className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-3.5">
          <Link href="/register" className={`${whiteButtonClass} group w-full sm:w-auto`}>
            Criar conta
            <ArrowRight size={18} aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </Link>
          <a href="#platform" className={`${glassButtonClass} w-full sm:w-auto`}>Ver a plataforma</a>
        </motion.div>
      </motion.div>

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{ rotateX, rotateY, transformPerspective: 1400 }}
        className="relative mx-auto mt-16 max-w-[1060px] md:mt-24"
      >
        <div aria-hidden className="absolute -inset-x-6 -inset-y-8 -z-10 rounded-[40px] bg-[conic-gradient(from_200deg,rgba(0,229,160,0.28),rgba(96,165,250,0.28),rgba(167,139,250,0.3),rgba(244,114,182,0.22),rgba(0,229,160,0.28))] opacity-60 blur-3xl" />
        <WindowFrame url="app.ironledger.com/dashboard">
          <OverviewPanel />
        </WindowFrame>
        <p className="m-0 mt-5 text-center text-[12.5px] text-white/45">Prévia ilustrativa, com dados de exemplo.</p>
      </motion.div>
    </section>
  );
}
