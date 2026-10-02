"use client";

import { ArrowRight, BarChart3, ChevronRight, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/shared/lib/animation";
import { ghostButtonClass, primaryButtonClass } from "./LandingPrimitives";

const avatars = [
  ["LF", "bg-primary-soft text-primary"], ["PY", "bg-info-soft text-info"], ["ML", "bg-purple-soft text-purple"],
  ["AO", "bg-red-400/10 text-red-400"], ["TP", "bg-yellow-400/10 text-yellow-400"],
];

export function HeroSection() {
  return <section id="top" className="relative z-10 flex min-h-screen items-center justify-center px-5 pt-28 pb-16 text-center md:px-10 md:pt-36 md:pb-20">
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full max-w-[900px]">
      <motion.div variants={staggerItem} className="mb-7 flex justify-center">
        <a href="#features" className="inline-flex items-center gap-2 rounded-full border border-primary-border bg-primary-soft px-4 py-2 text-[12.5px] font-semibold text-primary"><Sparkles size={13} />Novo — planejamento de estoque disponível<ChevronRight size={12} className="opacity-70" /></a>
      </motion.div>
      <motion.h1 variants={staggerItem} className="mb-7 text-[clamp(2.75rem,6.5vw,5rem)] leading-[1.03] font-black tracking-[-0.05em] text-foreground">Controle operacional <span className="inline-block bg-gradient-to-br from-primary via-purple to-info bg-clip-text pb-[0.1em] text-transparent">sem ponto cego.</span></motion.h1>
      <motion.p variants={staggerItem} className="mx-auto mb-11 max-w-2xl text-[clamp(1rem,2vw,1.25rem)] leading-relaxed tracking-[-0.01em] text-muted-foreground">Acompanhe movimentações, confira saldos e consulte o histórico de cada operação sem reunir informações de vários sistemas.</motion.p>
      <motion.div variants={staggerItem} className="flex flex-wrap justify-center gap-3.5">
        <Link href="/login" className={`${primaryButtonClass} max-sm:w-full`}>Começar agora <ArrowRight size={16} /></Link>
        <Link href="/dashboard" className={`${ghostButtonClass} max-sm:w-full`}><BarChart3 size={16} />Ver demonstração</Link>
      </motion.div>
      <motion.div variants={staggerItem} className="mt-12 flex flex-col items-center gap-2.5">
        <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={15} className="fill-primary text-primary" />)}</div>
        <div className="flex items-center gap-2">
          <div className="flex">{avatars.map(([initials, classes], index) => <span key={initials} className={`flex size-7 items-center justify-center rounded-full border-2 border-background text-[8.5px] font-bold ${classes} ${index ? "-ml-2" : ""}`}>{initials}</span>)}</div>
          <p className="text-[13px] tracking-[-0.01em] text-muted-foreground">Usado por <strong className="text-foreground">+200 equipes</strong> no dia a dia</p>
        </div>
      </motion.div>
    </motion.div>
  </section>;
}
