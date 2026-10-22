import { ArrowUp, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { landingFooterGroups } from "../../model/fixtures";
import type { LandingFooterLink } from "../../model/types";

const linkClass =
  "inline-flex items-center gap-2 rounded-md py-0.5 text-[14px] tracking-[-0.01em] outline-none focus-visible:ring-2 focus-visible:ring-primary/60";

function FooterLink({ link }: { link: LandingFooterLink }) {
  if (!link.href) {
    // Página ainda não publicada: visível, mas sem fingir que é clicável.
    return (
      <span className={`${linkClass} cursor-default text-white/40`}>
        {link.label}
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-px text-[10.5px] font-medium tracking-normal text-white/45">Em breve</span>
      </span>
    );
  }
  return (
    <Link
      href={link.href}
      className={`${linkClass} text-muted-foreground decoration-white/30 underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline motion-reduce:transition-none`}
    >
      {link.label}
    </Link>
  );
}

export function LandingFooter() {
  return (
    <footer className="relative z-10 isolate overflow-hidden px-5 pt-16 pb-10 md:px-10 md:pt-24 md:pb-0">
      {/* Fio de luz no topo, na mesma paleta dos orbes do CTA */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-primary/0 via-primary/60 to-info/0 blur-[1px]" />

      {/* Brilho ambiente atrás do nome gigante */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[420px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_35%,black_65%,transparent)]">
        <div className="absolute bottom-[-180px] left-[8%] size-[420px] animate-[orb-drift-a_20s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,#00e5a0,transparent_68%)] opacity-[0.22] blur-[80px] motion-reduce:animate-none" />
        <div className="absolute bottom-[-220px] left-[38%] size-[460px] animate-[orb-drift-c_24s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,#a78bfa,transparent_68%)] opacity-[0.22] blur-[90px] motion-reduce:animate-none" />
        <div className="absolute right-[6%] bottom-[-190px] size-[400px] animate-[orb-drift-b_22s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,#60a5fa,transparent_68%)] opacity-[0.2] blur-[80px] motion-reduce:animate-none" />
      </div>

      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-10">
          <div>
            <Link href="/" className="mb-5 inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/60" aria-label="Iron Ledger, página inicial">
              <Image src="/brand/logo-symbol-dark.svg" alt="" width={26} height={29} className="h-[29px] w-[26px]" />
              <span className="text-[17px] font-semibold tracking-[-0.025em] text-foreground">Iron Ledger</span>
            </Link>
            <p className="mb-6 max-w-[280px] text-[14.5px] leading-relaxed tracking-[-0.01em] text-muted-foreground">
              Estoque, movimentações e conferência financeira em um só lugar.
            </p>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[12.5px] tracking-[-0.01em] text-white/75 backdrop-blur-xl">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              Sistemas funcionando normalmente
            </p>
          </div>

          <nav aria-label="Rodapé" className="grid grid-cols-2 gap-x-6 gap-y-10 md:col-span-3 md:grid-cols-3 md:gap-10">
            {landingFooterGroups.map((group) => (
              <div key={group.title}>
                <h3 className="mb-4 text-[12.5px] font-semibold tracking-[-0.005em] text-foreground">{group.title}</h3>
                <ul className="m-0 grid list-none gap-2 p-0">
                  {group.links.map((link) => (
                    <li key={link.label}><FooterLink link={link} /></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-white/[0.08] pt-6 text-[13px] text-white/55 md:mt-20">
          <p className="m-0">© 2026 Iron Ledger. Todos os direitos reservados.</p>
          <p className="m-0 flex items-center gap-1.5">
            <Lock size={12} aria-hidden /> Acesso protegido e histórico de alterações · v2.4.0
          </p>
          <a
            href="#top"
            aria-label="Voltar ao topo"
            className="ml-auto grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-white/80 backdrop-blur-xl transition-[background-color,transform] duration-150 outline-none hover:bg-white/[0.12] hover:text-white focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-95 motion-reduce:transition-none"
          >
            <ArrowUp size={16} aria-hidden />
          </a>
        </div>
      </div>

      {/* Nome gigante que se perde no fundo, como assinatura */}
      <div aria-hidden className="pointer-events-none mx-auto mt-6 max-w-[1200px] select-none md:mt-2">
        <p className="m-0 bg-gradient-to-b from-white/[0.13] via-white/[0.04] to-transparent md:translate-y-[18%] bg-clip-text text-center text-[clamp(4rem,19vw,17rem)] leading-[0.85] font-semibold tracking-[-0.06em] whitespace-nowrap text-transparent">
          Iron Ledger
        </p>
      </div>
    </footer>
  );
}
