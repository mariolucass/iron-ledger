"use client";

import { ArrowRight, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { landingNavLinks } from "../../model/fixtures";
import { primaryButtonClass } from "./LandingPrimitives";

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navClass = scrolled || menuOpen ? "border-border bg-background/95 backdrop-blur-xl" : "border-transparent bg-transparent";

  return <>
    <header className={`fixed inset-x-0 top-0 z-50 h-16 border-b transition-all ${navClass}`}>
      <nav aria-label="Navegação principal" className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-5 md:px-10">
        <a href="#top" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Iron Ledger" width={30} height={30} className="size-[30px] rounded-lg object-contain" priority />
          <span><strong className="block text-sm leading-tight font-extrabold tracking-[-0.035em]">Iron Ledger</strong><small className="block text-[8.5px] leading-tight font-semibold tracking-[0.1em] text-primary uppercase">Gestão operacional</small></span>
        </a>
        <div className="hidden items-center gap-8 md:flex">
          {landingNavLinks.map((link) => <a key={link.href} href={link.href} className="relative py-1.5 text-sm font-medium text-muted-foreground transition after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-primary after:transition-transform hover:text-foreground hover:after:scale-x-100">{link.label}</a>)}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="px-1 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">Entrar</Link>
          <Link href="/login" className={`${primaryButtonClass} px-5 py-2.5 text-[13.5px]`}>Começar grátis <ArrowRight size={14} /></Link>
        </div>
        <button type="button" onClick={() => setMenuOpen((current) => !current)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} className="flex size-9 items-center justify-center rounded-lg border border-border text-foreground md:hidden">
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>
    </header>
    {menuOpen && <div id="mobile-navigation" className="fixed inset-x-0 top-16 z-40 animate-in fade-in slide-in-from-top-2 border-b border-border bg-background/98 px-5 pt-4 pb-6 backdrop-blur-xl md:hidden">
      <div className="flex flex-col gap-1">
        {landingNavLinks.map((link) => <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-4 py-3 text-[15px] font-medium text-muted-foreground transition hover:bg-card hover:text-foreground">{link.label}</a>)}
        <div className="my-2 h-px bg-border" />
        <Link href="/login" onClick={() => setMenuOpen(false)} className="rounded-lg px-4 py-3 text-[15px] font-medium text-muted-foreground">Entrar</Link>
        <Link href="/login" onClick={() => setMenuOpen(false)} className={`${primaryButtonClass} mt-2 w-full rounded-xl py-3 text-sm`}>Começar grátis <ArrowRight size={15} /></Link>
      </div>
    </div>}
  </>;
}
