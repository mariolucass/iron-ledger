"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ease2 } from "@/shared/lib/animation";
import { landingFeatures } from "../../api/mocks";
import type { LandingFeature } from "../../model/types";
import { landingIcons, landingTones } from "../config";
import { Reveal, SectionHeading } from "./LandingPrimitives";

function FeatureCard({ feature, delay }: { feature: LandingFeature; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const Icon = landingIcons[feature.icon];
  const tone = landingTones[feature.tone];

  return <motion.article ref={ref} initial={{ opacity: 0, y: 32 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: ease2, delay }} className={`group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-7 transition duration-200 hover:-translate-y-1 hover:bg-card-elevated hover:shadow-elevated ${tone.hover}`}>
    <div className={`mb-5 flex size-11 items-center justify-center rounded-xl border ${tone.soft} ${tone.border}`}><Icon size={20} strokeWidth={1.8} className={tone.text} /></div>
    <h3 className="mb-2.5 text-[17px] leading-tight font-bold tracking-[-0.025em] text-foreground">{feature.title}</h3>
    <p className="text-[13.5px] leading-relaxed text-muted-foreground">{feature.description}</p>
    <div aria-hidden className={`absolute -top-5 -right-5 size-20 rounded-full opacity-0 blur-3xl transition-opacity group-hover:opacity-30 ${tone.soft}`} />
  </motion.article>;
}

export function FeaturesSection() {
  return <section id="features" className="relative z-10 mx-auto max-w-[1200px] px-5 py-16 md:px-10 md:py-24">
    <Reveal><SectionHeading eyebrow="Recursos" title={<>O essencial para acompanhar<br /><span className="text-muted-foreground">a rotina da operação.</span></>} description="Recursos para reduzir conferências manuais e manter as informações de estoque e financeiro organizadas." /></Reveal>
    <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
      {landingFeatures.slice(0, 5).map((feature, index) => <div key={feature.title} className={index === 0 ? "md:row-span-2" : ""}><FeatureCard feature={feature} delay={index * 0.08} /></div>)}
    </div>
    <div className="mt-4"><FeatureCard feature={landingFeatures[5]} delay={0.4} /></div>
  </section>;
}
