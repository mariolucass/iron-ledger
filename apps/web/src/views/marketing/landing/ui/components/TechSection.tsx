import { Fragment } from "react";
import { landingFlow, landingStack } from "../../model/fixtures";
import { landingIcons, landingTones } from "../config";
import { OrbField } from "@/shared/ui/orbs";
import { Reveal, SectionHeading } from "./LandingPrimitives";

function Connector() {
  return (
    <div aria-hidden className="relative mx-auto h-8 w-px overflow-hidden bg-ink/10 md:h-px md:w-full md:min-w-6 md:self-center">
      <span className="absolute inset-0 animate-[flow-y_2.4s_linear_infinite] bg-gradient-to-b from-transparent via-primary to-transparent motion-reduce:hidden md:animate-[flow-x_2.4s_linear_infinite] md:bg-gradient-to-r" />
    </div>
  );
}

export function TechSection() {
  return (
    <section id="tech" className="relative isolate z-10 px-5 py-20 md:px-10 md:py-32">
      <OrbField variant="warm" />
      <div className="mx-auto max-w-[1100px]">
        <Reveal>
          <SectionHeading
            eyebrow="Arquitetura"
            title="Eventos com trilha de entrega"
            description="No fluxo ativo, a API grava o evento no outbox e o RabbitMQ o entrega à auditoria. O Analytics roda separadamente, em lote com dados históricos da Olist; Kafka é opcional e ainda não tem relay operacional."
          />
        </Reveal>

        <Reveal>
          <ol className="m-0 grid list-none gap-0 p-0 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] md:gap-3">
            {landingFlow.map((node, index) => {
              const Icon = landingIcons[node.icon];
              const tone = landingTones[node.tone];
              return (
                <Fragment key={node.title}>
                  {index > 0 && <li aria-hidden className="list-none"><Connector /></li>}
                  <li className="rounded-3xl border border-ink/10 bg-ink/[0.03] p-5 text-center backdrop-blur-xl">
                    <span aria-hidden className={`mx-auto mb-4 grid size-11 place-items-center rounded-2xl border ${tone.border} ${tone.soft} ${tone.text}`}>
                      <Icon size={20} strokeWidth={1.7} />
                    </span>
                    <h3 className="m-0 mb-1.5 text-[17px] font-semibold tracking-[-0.025em] text-foreground">{node.title}</h3>
                    <p className="m-0 text-[13.5px] leading-snug text-ink/60">{node.detail}</p>
                  </li>
                </Fragment>
              );
            })}
          </ol>
        </Reveal>

        <Reveal delay={0.05}>
          <dl className="m-0 mx-auto mt-14 grid max-w-[760px] grid-cols-3 gap-4 text-center">
            {[
              ["8", "contextos de domínio"],
              ["48", "entidades modeladas"],
              ["4", "etapas por transação"],
            ].map(([value, label]) => (
              <div key={label}>
                <dd className="m-0 bg-gradient-to-b from-foreground to-ink/60 bg-clip-text text-[clamp(2rem,5vw,3.25rem)] leading-none font-semibold tracking-[-0.045em] text-transparent tabular-nums">{value}</dd>
                <dt className="mt-2 text-[13.5px] text-ink/60">{label}</dt>
              </div>
            ))}
          </dl>

          <ul aria-label="Tecnologias" className="m-0 mt-12 flex list-none flex-wrap justify-center gap-2.5 p-0">
            {landingStack.map((name) => (
              <li key={name} className="rounded-full border border-ink/10 bg-ink/[0.04] px-4 py-2 text-[14px] font-medium tracking-[-0.01em] text-ink/80 backdrop-blur-xl">{name}</li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
