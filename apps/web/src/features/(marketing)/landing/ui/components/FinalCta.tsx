import { ArrowRight, BarChart3, Lock } from "lucide-react";
import Link from "next/link";
import { Reveal, ghostButtonClass, primaryButtonClass } from "./LandingPrimitives";

export function FinalCta() {
  return <section className="relative z-10 px-5 py-6 pb-16 md:px-10 md:py-10 md:pb-20">
    <Reveal><div className="relative mx-auto max-w-[1100px] overflow-hidden rounded-3xl border border-border-strong bg-gradient-to-br from-primary/[0.07] via-transparent to-purple/[0.07] px-6 py-12 text-center md:px-14 md:py-20">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,229,160,0.05),transparent_60%)]" />
      <div className="relative mb-6 flex justify-center"><span className="inline-flex items-center gap-1.5 rounded-full border border-primary-border bg-primary-soft px-3.5 py-1.5 text-[11.5px] font-semibold text-primary"><span className="size-1.5 animate-pulse rounded-full bg-primary" />Ambiente disponível para teste</span></div>
      <h2 className="relative mb-5 text-[clamp(1.875rem,4.5vw,3.5rem)] leading-[1.05] font-black tracking-[-0.05em] text-foreground">Quer organizar melhor<br />sua operação financeira?</h2>
      <p className="relative mx-auto mb-11 max-w-[480px] text-[17px] leading-relaxed text-muted-foreground">Conheça o fluxo completo, do registro de uma movimentação até a conferência dos saldos e do histórico.</p>
      <div className="relative flex flex-wrap justify-center gap-3.5"><Link href="/login" className={`${primaryButtonClass} px-9 py-4 text-base max-sm:w-full`}>Começar agora <ArrowRight size={18} /></Link><Link href="/dashboard" className={`${ghostButtonClass} px-9 py-[15px] text-base max-sm:w-full`}><BarChart3 size={16} />Ver o dashboard</Link></div>
      <p className="relative mt-5 text-[12.5px] tracking-[-0.01em] text-subtle-foreground"><Lock size={11} className="mr-1 inline align-middle" />Sem cartão de crédito. Você pode explorar o sistema antes de configurar sua operação.</p>
    </div></Reveal>
  </section>;
}
