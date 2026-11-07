"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { landingFeatures } from "../../model/fixtures";
import type { LandingTone } from "../../model/types";
import { landingIcons, landingTones } from "../config";
import { OrbField } from "@/shared/ui/orbs";
import { Reveal, SectionHeading } from "./LandingPrimitives";

const spanClass = { 2: "md:col-span-2", 3: "md:col-span-3", 4: "md:col-span-4" } as const;

const glow: Record<LandingTone, string> = {
  primary: "rgba(0,229,160,0.16)",
  blue: "rgba(96,165,250,0.16)",
  purple: "rgba(167,139,250,0.18)",
  emerald: "rgba(52,211,153,0.16)",
  orange: "rgba(251,146,60,0.16)",
  yellow: "rgba(250,204,21,0.14)",
  red: "rgba(248,113,113,0.16)",
};

/** Cartão de vidro com um brilho que segue o cursor. */
function SpotlightCard({ children, className, tone }: { children: ReactNode; className: string; tone: LandingTone }) {
  const ref = useRef<HTMLDivElement>(null);
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    element.style.setProperty("--sx", `${event.clientX - rect.left}px`);
    element.style.setProperty("--sy", `${event.clientY - rect.top}px`);
  };
  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      className={`group relative overflow-hidden rounded-[28px] border border-ink/10 bg-ink/[0.03] p-7 transition-colors duration-300 hover:border-ink/20 motion-reduce:transition-none md:p-8 ${className}`}
    >
      <div
        aria-hidden
        style={{ background: `radial-gradient(380px circle at var(--sx, 50%) var(--sy, 50%), ${glow[tone]}, transparent 70%)` }}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ink/15 to-transparent" />
      <div className="relative flex h-full flex-col">{children}</div>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="relative isolate z-10 px-5 py-20 md:px-10 md:py-32">
      <OrbField variant="aurora" />
      <div className="mx-auto max-w-[1100px]">
        <Reveal>
          <SectionHeading
            eyebrow="Recursos"
            title="O que o sistema faz, sem rodeios"
            description="Cada recurso abaixo existe hoje no produto. Nada de promessa para depois."
          />
        </Reveal>

        <div className="grid gap-4 md:grid-cols-6">
          {landingFeatures.map((feature, index) => {
            const Icon = landingIcons[feature.icon];
            const tone = landingTones[feature.tone];
            return (
              <Reveal key={feature.title} delay={(index % 3) * 0.06} className={spanClass[feature.span]}>
                <SpotlightCard tone={feature.tone} className="h-full min-h-[240px]">
                  <span aria-hidden className={`mb-6 grid size-12 place-items-center rounded-2xl border ${tone.border} ${tone.soft} ${tone.text}`}>
                    <Icon size={22} strokeWidth={1.7} />
                  </span>
                  <h3 className="m-0 mb-2.5 text-[21px] leading-tight font-semibold tracking-[-0.03em] text-foreground">{feature.title}</h3>
                  <p className="m-0 max-w-[520px] text-[15.5px] leading-relaxed tracking-[-0.008em] text-ink/65">{feature.description}</p>
                  {feature.sample && (
                    <p className="m-0 mt-auto inline-flex w-fit pt-6">
                      <span className="rounded-xl border border-ink/10 bg-sunken px-3 py-1.5 font-mono text-[13px] text-ink/80">{feature.sample}</span>
                    </p>
                  )}
                </SpotlightCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
