"use client";

import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { ease2 } from "@/shared/lib/animation";
import { landingTestimonials } from "../../api/mocks";
import { landingTones } from "../config";
import { Reveal, SectionHeading } from "./LandingPrimitives";

export function TestimonialsSection() {
  return <section id="testimonials" className="relative z-10 mx-auto max-w-[1200px] px-5 py-16 md:px-10 md:py-24">
    <Reveal><SectionHeading eyebrow="Depoimentos" title="O que mudou na rotina das equipes" /></Reveal>
    <div className="grid gap-5 md:grid-cols-3">
      {landingTestimonials.map((testimonial, index) => {
        const tone = landingTones[testimonial.tone];
        return <motion.article key={testimonial.author} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.65, ease: ease2, delay: index * 0.12 }} className={`flex flex-col gap-5 rounded-2xl border border-border border-l-[3px] bg-card p-7 ${tone.border}`}>
          <div className="flex gap-0.5">{Array.from({ length: testimonial.stars }).map((_, star) => <Star key={star} size={13} className={`${tone.text} fill-current`} />)}</div>
          <blockquote className="flex-1 text-[14.5px] leading-[1.7] italic text-muted-foreground">“{testimonial.quote}”</blockquote>
          <div className="flex items-center gap-3"><span className={`flex size-[38px] shrink-0 items-center justify-center rounded-full border text-[11px] font-extrabold tracking-[0.02em] ${tone.soft} ${tone.border} ${tone.text}`}>{testimonial.initials}</span><div><strong className="block text-[13.5px] font-bold tracking-[-0.015em] text-foreground">{testimonial.author}</strong><span className="text-xs text-muted-foreground">{testimonial.role}</span></div></div>
        </motion.article>;
      })}
    </div>
  </section>;
}
