"use client";

import { useInView } from "framer-motion";
import { useRef } from "react";
import { landingStats } from "../../api/mocks";
import type { LandingStat } from "../../model/types";
import { useCountUp } from "../../model/useCountUp";
import { Reveal } from "./LandingPrimitives";

function StatCard({ stat, active }: { stat: LandingStat; active: boolean }) {
  const count = useCountUp(stat.value, active, stat.duration);
  return <div className="flex flex-col items-center gap-2 px-4 text-center md:px-8">
    <strong className="bg-gradient-to-br from-foreground to-primary bg-clip-text text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-[-0.04em] text-transparent tabular-nums">{stat.prefix}{count}{stat.suffix}</strong>
    <span className="text-[13px] font-medium tracking-[0.01em] text-muted-foreground">{stat.label}</span>
  </div>;
}

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const active = useInView(ref, { once: true, margin: "-100px" });
  return <section className="relative z-10 px-5 pb-16 md:px-10 md:pb-20">
    <Reveal><div ref={ref} className="relative mx-auto grid max-w-[1100px] grid-cols-2 gap-y-8 overflow-hidden rounded-[20px] border border-border bg-card px-2.5 py-8 md:grid-cols-4 md:px-5 md:py-10">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px animate-pulse bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      {landingStats.map((stat, index) => <div key={stat.label} className={index ? "border-l border-border" : ""}><StatCard stat={stat} active={active} /></div>)}
    </div></Reveal>
  </section>;
}
