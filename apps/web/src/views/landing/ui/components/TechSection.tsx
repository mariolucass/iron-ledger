"use client";

import { motion } from "framer-motion";
import { spring4 } from "@/shared/lib/animation";
import { landingTechnologies } from "../../model/fixtures";
import { landingIcons, landingTones } from "../config";
import { Reveal, SectionHeading } from "./LandingPrimitives";

export function TechSection() {
  return <section id="tech" className="relative z-10 px-5 py-16 md:px-10 md:py-24">
    <Reveal><SectionHeading eyebrow="Infraestrutura" title="Integrações que fazem parte da operação" description="O Iron Ledger se conecta a ferramentas conhecidas para processar eventos, armazenar dados e manter os fluxos em funcionamento." /></Reveal>
    <Reveal delay={0.1} className="mx-auto flex max-w-[900px] flex-wrap justify-center gap-3.5">
      {landingTechnologies.map((technology) => {
        const Icon = landingIcons[technology.icon];
        const tone = landingTones[technology.tone];
        return <motion.div key={technology.name} whileHover={{ y: -6, scale: 1.04 }} transition={spring4} className="flex cursor-default items-center gap-2.5 rounded-[14px] border border-border bg-card px-5 py-3.5">
          <span className={`flex size-8 items-center justify-center rounded-lg border ${tone.soft} ${tone.border}`}><Icon size={16} strokeWidth={1.8} className={tone.text} /></span>
          <strong className="text-sm font-semibold tracking-[-0.015em] text-foreground">{technology.name}</strong>
        </motion.div>;
      })}
    </Reveal>
  </section>;
}
