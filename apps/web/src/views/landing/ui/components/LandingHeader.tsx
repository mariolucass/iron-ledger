"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { landingNavLinks } from "../../model/fixtures";

const sectionIds = landingNavLinks.map((link) => link.href.slice(1));

/** Seção que cruza a faixa central da tela; `null` enquanto o hero está no topo. */
function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        setActive(ids.find((id) => visible.has(id)) ?? null);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const id of ids) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

function useScrolled(threshold = 12): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

const focusRing = "outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const ctaClass = `inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-[14px] font-semibold tracking-[-0.01em] text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-[background-color,transform,box-shadow] duration-150 hover:bg-primary-hover hover:shadow-[0_8px_24px_rgba(0,229,160,0.28),inset_0_1px_0_rgba(255,255,255,0.35)] active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 ${focusRing}`;

export function LandingHeader() {
  const reducedMotion = useReducedMotion();
  const scrolled = useScrolled();
  const activeSection = useActiveSection(sectionIds);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  // Menu móvel: fecha com Esc, trava a rolagem do fundo e se desfaz ao voltar para o desktop.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    const desktop = window.matchMedia("(min-width: 768px)");
    const onChange = () => desktop.matches && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onChange);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onChange);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const highlighted = hovered ?? (activeSection ? `#${activeSection}` : null);
  const glass = scrolled || menuOpen
    ? "border-white/[0.12] bg-[rgb(18_20_22/0.72)] shadow-[0_10px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-2xl backdrop-saturate-150"
    : "border-white/[0.07] bg-white/[0.03] backdrop-blur-md";
  const spring = reducedMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 36 };

  return (
    <>
      <AnimatePresence>
        {menuOpen && (
          <motion.button
            type="button"
            aria-label="Fechar menu"
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 cursor-default border-0 bg-black/50 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 md:px-6 md:pt-4">
        <div className="relative w-full max-w-[980px]">
          <nav
            aria-label="Navegação principal"
            className={`pointer-events-auto flex h-14 items-center justify-between gap-3 rounded-full border pr-2 pl-4 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 motion-reduce:transition-none ${glass}`}
          >
            <a href="#top" onClick={() => setMenuOpen(false)} className={`flex shrink-0 items-center gap-2.5 rounded-full py-1 pr-2 ${focusRing}`}>
              <Image src="/brand/logo-symbol-dark.svg" alt="" width={22} height={25} priority className="h-[25px] w-[22px]" />
              <span className="text-[15px] font-semibold tracking-[-0.025em] text-foreground">Iron Ledger</span>
            </a>

            <ul
              className="m-0 hidden list-none items-center gap-0.5 p-0 md:flex"
              onPointerLeave={() => setHovered(null)}
            >
              {landingNavLinks.map((link) => {
                const on = highlighted === link.href;
                return (
                  <li key={link.href} className="relative">
                    <a
                      href={link.href}
                      aria-current={activeSection && `#${activeSection}` === link.href ? "location" : undefined}
                      onPointerEnter={() => setHovered(link.href)}
                      onFocus={() => setHovered(link.href)}
                      onBlur={() => setHovered(null)}
                      className={`relative z-10 inline-flex h-9 items-center rounded-full px-4 text-[14px] font-medium tracking-[-0.015em] transition-colors duration-150 ${on ? "text-foreground" : "text-muted-foreground"} ${focusRing}`}
                    >
                      {link.label}
                    </a>
                    {on && (
                      <motion.span
                        layoutId="landing-nav-highlight"
                        transition={spring}
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-white/[0.08]"
                      />
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-1">
              <Link
                href="/login"
                className={`hidden h-10 items-center rounded-full px-4 text-[14px] font-medium tracking-[-0.015em] text-muted-foreground transition-colors duration-150 hover:bg-white/[0.07] hover:text-foreground md:inline-flex ${focusRing}`}
              >
                Entrar
              </Link>
              <Link href="/register" className={`${ctaClass} hidden md:inline-flex`}>
                Criar conta <ArrowRight size={14} aria-hidden />
              </Link>

              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-controls="mobile-navigation"
                aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
                className={`grid size-10 place-items-center rounded-full text-foreground transition-colors hover:bg-white/[0.08] md:hidden ${focusRing}`}
              >
                {menuOpen ? <X size={19} strokeWidth={1.9} /> : <Menu size={19} strokeWidth={1.9} />}
              </button>
            </div>
          </nav>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                id="mobile-navigation"
                initial={reducedMotion ? false : { opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "top center" }}
                className="pointer-events-auto absolute inset-x-0 top-[calc(100%+8px)] rounded-3xl border border-white/[0.12] bg-[rgb(18_20_22/0.88)] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-2xl backdrop-saturate-150 md:hidden"
              >
                <ul className="m-0 grid list-none gap-0.5 p-0">
                  {landingNavLinks.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex h-12 items-center rounded-2xl px-4 text-[17px] font-medium tracking-[-0.02em] transition-colors hover:bg-white/[0.07] ${activeSection && `#${activeSection}` === link.href ? "text-primary" : "text-foreground"} ${focusRing}`}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="mx-2 my-2 h-px bg-white/[0.08]" />
                <div className="grid gap-2 p-1">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className={`flex h-12 items-center justify-center rounded-2xl text-[16px] font-medium text-foreground transition-colors hover:bg-white/[0.07] ${focusRing}`}
                  >
                    Entrar
                  </Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)} className={`${ctaClass} !h-12 w-full rounded-2xl text-[16px]`}>
                    Criar conta <ArrowRight size={16} aria-hidden />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>
    </>
  );
}
