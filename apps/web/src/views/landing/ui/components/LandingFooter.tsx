import { Lock } from "lucide-react";
import Image from "next/image";
import { landingFooterGroups } from "../../model/fixtures";

export function LandingFooter() {
  return <footer className="relative z-10 border-t border-border px-5 py-10 md:px-10 md:py-14">
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-12 grid gap-8 md:mb-14 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:gap-12">
        <div><div className="mb-4 flex items-center gap-2.5"><Image src="/logo.png" alt="Iron Ledger" width={32} height={32} className="size-8 rounded-lg object-contain" /><span><strong className="block text-sm leading-tight font-extrabold tracking-[-0.03em]">Iron Ledger</strong><small className="block text-[8.5px] font-semibold tracking-[0.1em] text-primary uppercase">Gestão operacional</small></span></div><p className="max-w-60 text-[13px] leading-relaxed text-muted-foreground">Estoque, movimentações e conferência financeira em um só lugar.</p><div className="mt-4 flex items-center gap-1.5"><span className="size-1.5 animate-pulse rounded-full bg-primary" /><span className="text-[11.5px] text-muted-foreground">Sistemas funcionando normalmente</span></div></div>
        {landingFooterGroups.map((group) => <div key={group.title}><h3 className="mb-4 text-[11px] font-bold tracking-[0.1em] text-subtle-foreground uppercase">{group.title}</h3><div className="flex flex-col items-start gap-2.5">{group.links.map((link) => <button type="button" key={link} className="p-0 text-left text-[13.5px] font-normal tracking-[-0.01em] text-muted-foreground transition hover:text-foreground">{link}</button>)}</div></div>)}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-7 text-xs text-subtle-foreground"><span>© 2026 Iron Ledger. Todos os direitos reservados.</span><span className="flex items-center gap-1.5 text-[11.5px]"><Lock size={11} />Acesso protegido e histórico de alterações · v2.4.0</span></div>
    </div>
  </footer>;
}
