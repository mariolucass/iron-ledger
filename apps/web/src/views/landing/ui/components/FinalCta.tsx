"use client";

import { ArrowRight, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Reveal } from "./LandingPrimitives";
import { ParallaxOrb, usePointerParallax } from "@/shared/ui/orbs";

/** Esfera de vidro com highlight, brilho colorido e uma órbita fina. */
function GlassSphere() {
  return (
    <div aria-hidden className="relative mx-auto mb-9 size-24 animate-[orb-float_6s_ease-in-out_infinite] motion-reduce:animate-none">
      <div className="absolute -inset-5 animate-[orb-spin_16s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,#00e5a0,#60a5fa,#a78bfa,#f472b6,#00e5a0)] opacity-60 blur-2xl motion-reduce:animate-none" />
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_22%,rgba(255,255,255,0.95)_0,rgba(255,255,255,0.25)_18%,transparent_38%),conic-gradient(from_210deg,#00e5a0,#60a5fa,#a78bfa,#f472b6,#00e5a0)] shadow-[inset_0_-12px_28px_rgba(0,0,0,0.5),inset_0_2px_8px_rgba(255,255,255,0.55),0_24px_70px_rgba(96,165,250,0.35)]" />
      <div className="absolute -inset-3.5 rounded-full border border-white/10" />
      <div className="absolute -inset-3.5 animate-[orb-spin_9s_linear_infinite] motion-reduce:animate-none">
        <span className="absolute top-0 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_3px_rgba(255,255,255,0.7)]" />
      </div>
    </div>
  );
}

export function FinalCta() {
  const { x, y, onPointerMove, onPointerLeave } = usePointerParallax();

  return (
    <section className="relative z-10 px-5 py-6 pb-16 md:px-10 md:py-10 md:pb-24">
      <Reveal>
        <div
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          className="relative isolate mx-auto max-w-[1100px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0b0d] px-6 py-16 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_40px_120px_-30px_rgba(0,0,0,0.9)] md:rounded-[2.5rem] md:px-14 md:py-24"
        >
          {/* Orbes */}
          <ParallaxOrb x={x} y={y} depth={-60} color="green" position="-top-40 -left-32 size-[440px]" opacity={0.7} motion={0} />
          <ParallaxOrb x={x} y={y} depth={50} color="blue" position="-top-28 -right-24 size-[400px]" opacity={0.65} motion={1} />
          <ParallaxOrb x={x} y={y} depth={-40} color="violet" position="-bottom-56 left-[28%] size-[480px]" opacity={0.7} motion={2} />
          <ParallaxOrb x={x} y={y} depth={70} color="pink" position="-right-10 -bottom-32 size-[320px]" opacity={0.5} motion={3} />

          {/* Malha de pontos que some nas bordas */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(rgba(255,255,255,0.16)_1px,transparent_1px)] bg-[size:26px_26px] opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_72%)]" />
          {/* Vinheta central: garante contraste do texto sobre os orbes */}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_center,rgba(8,9,11,0.72),transparent_75%)]" />

          <div className="relative">
            <GlassSphere />

            <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[12.5px] font-medium tracking-[-0.01em] text-white/85 backdrop-blur-xl">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              Ambiente disponível para teste
            </p>

            <h2 className="mx-auto mb-5 max-w-[760px] bg-gradient-to-b from-white via-white to-white/55 bg-clip-text text-[clamp(2.25rem,5.6vw,4.25rem)] leading-[1.04] font-semibold tracking-[-0.045em] text-transparent">
              Quer organizar melhor
              <br />
              sua operação financeira?
            </h2>
            <p className="mx-auto mb-10 max-w-[520px] text-[17px] leading-relaxed tracking-[-0.01em] text-white/70 md:text-[18px]">
              Conheça o fluxo completo, do registro de uma movimentação até a conferência dos saldos e do histórico.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-3.5">
              <Link
                href="/register"
                className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-8 text-[16px] font-semibold tracking-[-0.015em] text-[#0a0b0d] shadow-[0_0_0_1px_rgba(255,255,255,0.5),0_14px_44px_rgba(255,255,255,0.2)] transition-[transform,box-shadow] duration-200 outline-none hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.6),0_18px_56px_rgba(255,255,255,0.3)] focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0b0d] active:translate-y-0 active:scale-[0.98] motion-reduce:transition-none sm:w-auto"
              >
                Começar agora
                <ArrowRight size={18} aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.07] px-8 text-[16px] font-medium tracking-[-0.015em] text-white backdrop-blur-xl transition-[background-color,border-color,transform] duration-200 outline-none hover:border-white/30 hover:bg-white/[0.13] focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0b0d] active:scale-[0.98] motion-reduce:transition-none sm:w-auto"
              >
                <BarChart3 size={17} aria-hidden />
                Ver o dashboard
              </Link>
            </div>

            <p className="mx-auto mt-7 max-w-[460px] text-[13.5px] leading-normal text-white/55">
              Sem cartão de crédito. Você pode explorar o sistema antes de configurar sua operação.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
