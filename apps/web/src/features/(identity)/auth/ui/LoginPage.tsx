"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { ease2 } from "@/shared/lib/animation";
import { LoginFormWrapper } from "./LoginFormWrapper";

const proofPoints = [
  "Auditoria imutável de cada operação",
  "Criptografia de nível corporativo",
  "Disponibilidade operacional de 99,99%",
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <button
      className="relative z-2 inline-flex w-fit cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left text-foreground"
      type="button"
      aria-label="Voltar para a página inicial"
      onClick={() => window.location.assign("/")}
    >
      <span className="grid size-10 place-items-center rounded-xl border border-white/13 bg-white/[0.055] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_30px_rgba(0,0,0,0.25)]">
        <img className="size-[31px] object-contain" src="/logo.png" alt="" />
      </span>
      <span className="flex flex-col gap-0.5">
        <strong className="text-sm tracking-[-0.025em]">Iron Ledger</strong>
        {!compact && (
          <small className="text-[9px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
            Inteligência operacional
          </small>
        )}
      </span>
    </button>
  );
}

function StatusPill() {
  return (
    <div
      className="inline-flex w-fit items-center gap-[7px] rounded-full border border-border bg-white/[0.025] px-2.5 py-[7px] text-[10px] font-semibold text-muted-foreground"
      role="status"
      aria-label="Todos os sistemas operacionais"
    >
      <span className="size-1.5 rounded-full bg-primary shadow-[0_0_0_4px_rgba(0,229,160,0.1),0_0_12px_rgba(0,229,160,0.45)]" />
      Todos os sistemas operacionais
    </div>
  );
}

export function LoginPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  // Keep the server output and the first client render identical. The reduced
  // motion media query is only available in the browser, so using it to choose
  // `initial` attributes causes a hydration mismatch.
  const entrance = {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
  };
  const motionDuration = (duration: number) =>
    prefersReducedMotion ? 0 : duration;

  return (
    <main className="grid min-h-svh isolate grid-cols-1 overflow-auto bg-background font-sans text-foreground min-[981px]:grid-cols-[minmax(420px,0.92fr)_minmax(520px,1.08fr)] min-[981px]:overflow-hidden motion-reduce:*:transition-none motion-reduce:*:animate-none">
      <section
        className="relative hidden min-h-svh flex-col overflow-hidden border-r border-border bg-[radial-gradient(circle_at_18%_16%,rgba(0,229,160,0.13),transparent_30%),radial-gradient(circle_at_82%_80%,rgba(103,80,255,0.13),transparent_32%),linear-gradient(145deg,#0b100e_0%,#080908_48%,#0b0b10_100%)] p-[clamp(28px,4vw,56px)] before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] before:bg-[size:56px_56px] before:opacity-[0.22] before:[mask-image:linear-gradient(to_bottom,black,transparent_90%)] after:pointer-events-none after:absolute after:top-[48%] after:left-[45%] after:size-[520px] after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:border after:border-white/[0.06] after:shadow-[0_0_0_80px_rgba(255,255,255,0.018),0_0_0_160px_rgba(255,255,255,0.012)] min-[981px]:flex"
        aria-label="Sobre o Iron Ledger"
      >
        <Brand />

        <motion.div
          className="relative z-2 my-auto w-[min(100%,560px)] py-[clamp(64px,10vh,120px)] [@media(max-height:760px)_and_(min-width:981px)]:py-12"
          {...entrance}
          transition={{ duration: motionDuration(0.8), ease: ease2 }}
        >
          <div className="mb-6 flex w-fit items-center gap-[7px] text-[10px] font-bold tracking-[0.12em] text-primary uppercase">
            <Sparkles size={13} />O sistema operacional das suas finanças
          </div>
          <h2 className="m-0 max-w-[540px] text-[clamp(42px,5.1vw,72px)] leading-[0.98] font-bold tracking-[-0.065em] text-balance">
            Clareza para decidir.{" "}
            <span className="bg-gradient-to-r from-primary via-[#73f6cd] to-[#9f93ff] bg-clip-text text-transparent">
              Controle para crescer.
            </span>
          </h2>
          <p className="mt-[26px] mb-9 max-w-[480px] text-[15px] leading-[1.7] tracking-[-0.01em] text-muted-foreground">
            Estoque, transações, auditoria e inteligência preditiva em uma única
            plataforma construída para operações que não podem parar.
          </p>

          <div className="grid gap-[13px]">
            {proofPoints.map((item, index) => (
              <motion.div
                className="flex items-center gap-[11px] text-[12.5px] font-medium text-[#c5c5c9]"
                key={item}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: motionDuration(0.5),
                  delay: prefersReducedMotion ? 0 : 0.35 + index * 0.09,
                  ease: ease2,
                }}
              >
                <span className="grid size-[22px] shrink-0 place-items-center rounded-full border border-primary/20 bg-primary-soft text-primary">
                  <Check size={12} strokeWidth={2.5} />
                </span>
                {item}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="relative z-2 flex items-center justify-between gap-[18px] text-[10px] tracking-[0.02em] text-subtle-foreground">
          <StatusPill />
          <span>Protegido por Iron Ledger Security</span>
        </div>
      </section>

      <section
        className="relative flex min-h-svh min-w-0 flex-col items-center justify-start bg-[radial-gradient(circle_at_15%_0%,rgba(0,229,160,0.1),transparent_28%),radial-gradient(circle_at_100%_78%,rgba(103,80,255,0.09),transparent_28%),var(--background)] px-[clamp(20px,7vw,64px)] pt-6 pb-[82px] min-[981px]:justify-center min-[981px]:bg-[radial-gradient(circle_at_50%_45%,rgba(0,229,160,0.035),transparent_34%),var(--background)] min-[981px]:px-[clamp(28px,7vw,112px)] min-[981px]:py-12 max-[520px]:px-[18px] max-[520px]:pt-[18px] max-[520px]:pb-8 [@media(max-height:760px)_and_(min-width:981px)]:pt-7 [@media(max-height:760px)_and_(min-width:981px)]:pb-11"
        aria-labelledby="login-title"
      >
        <div className="mb-[clamp(52px,10vh,96px)] flex w-full items-center justify-between max-[520px]:mb-12 max-[520px]:[&>[role=status]]:hidden min-[981px]:hidden">
          <Brand compact />
          <StatusPill />
        </div>

        <motion.div
          className="relative z-1 mx-auto w-[min(100%,430px)] min-[981px]:mx-0"
          {...entrance}
          transition={{
            duration: motionDuration(0.62),
            delay: prefersReducedMotion ? 0 : 0.08,
            ease: ease2,
          }}
        >
          <LoginFormWrapper />
        </motion.div>

        <footer className="mt-auto flex flex-wrap justify-center gap-x-[18px] gap-y-2 pt-[52px] text-[9.5px] text-subtle-foreground min-[981px]:absolute min-[981px]:right-[clamp(28px,4vw,56px)] min-[981px]:bottom-6 min-[981px]:left-[clamp(28px,4vw,56px)] min-[981px]:mt-0 min-[981px]:pt-0">
          {["Privacidade", "Segurança", "Suporte"].map((label) => (
            <button
              className="cursor-pointer border-0 bg-transparent p-0 text-[9.5px] font-[inherit] text-inherit hover:text-muted-foreground"
              key={label}
              type="button"
              onClick={() => router.push("/")}
            >
              {label}
            </button>
          ))}
          <span>© 2026 Iron Ledger</span>
        </footer>
      </section>
    </main>
  );
}
