import { landingSteps } from "../../model/fixtures";
import { gradientText, Reveal, SectionHeading } from "./LandingPrimitives";
import { OrbField } from "@/shared/ui/orbs";

export function HowItWorksSection() {
  return (
    <section id="how" className="relative isolate z-10 px-5 py-20 md:px-10 md:py-32">
      <OrbField variant="cool" />
      <div className="mx-auto max-w-[1100px]">
        <Reveal>
          <SectionHeading eyebrow="Como funciona" title="Do cadastro à conferência, em três passos" />
        </Reveal>

        <ol className="relative m-0 grid list-none gap-4 p-0 md:grid-cols-3 md:gap-5">
          <span aria-hidden className="pointer-events-none absolute top-[58px] right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-transparent via-white/20 to-transparent md:block" />
          {landingSteps.map((step, index) => (
            <Reveal key={step.title} delay={index * 0.08}>
              <li className="relative h-full rounded-[28px] border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl md:p-8">
                <span aria-hidden className={`${gradientText} mb-8 block text-[56px] leading-none font-semibold tracking-[-0.06em] tabular-nums`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="m-0 mb-2.5 text-[21px] font-semibold tracking-[-0.03em] text-foreground">{step.title}</h3>
                <p className="m-0 text-[15.5px] leading-relaxed text-white/65">{step.description}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
