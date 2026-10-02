"use client";

import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import { DashboardMockup } from "./DashboardMockup";
import { Reveal, SectionHeading } from "./LandingPrimitives";

export function ProductShowcase() {
  return <section className="relative z-10 px-5 py-10 pb-16 text-center md:px-10 md:pb-24">
    <Reveal><SectionHeading eyebrow="Plataforma" title="Uma visão clara da operação" description="Indicadores, movimentações e alertas reunidos para que a equipe saiba o que aconteceu e o que precisa de atenção." /></Reveal>
    <div className="relative mx-auto max-w-[1100px]">
      <div aria-hidden className="absolute top-[30%] left-[10%] h-2/5 w-4/5 rounded-full bg-purple/10 blur-[100px]" />
      <motion.div initial={{ opacity: 0, y: 40, rotateX: 6 }} whileInView={{ opacity: 1, y: 0, rotateX: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.8 }} className="relative [perspective:1200px]">
        <div className="overflow-hidden rounded-xl border border-border-strong bg-[#121212]/95 shadow-[0_60px_120px_rgba(0,0,0,0.7),0_0_80px_rgba(0,229,160,0.06)] md:rounded-[20px]">
          <div className="flex h-11 items-center gap-3.5 border-b border-border bg-white/[0.025] px-3 md:px-5">
            <div className="flex gap-1.5"><span className="size-2.5 rounded-full bg-[#ff5f57] md:size-3" /><span className="size-2.5 rounded-full bg-[#febc2e] md:size-3" /><span className="size-2.5 rounded-full bg-[#28c840] md:size-3" /></div>
            <div className="mx-auto flex h-6 max-w-[360px] flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-card text-[8px] text-subtle-foreground md:h-[26px] md:text-[11px]"><Lock size={10} />app.ironledger.com/dashboard</div>
          </div>
          <div className="h-[min(480px,55vw)] min-h-[230px] bg-background-deep"><DashboardMockup /></div>
        </div>
      </motion.div>
    </div>
  </section>;
}
