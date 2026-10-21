"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { OrbField } from "@/shared/ui/orbs";
import { Reveal, SectionHeading } from "./LandingPrimitives";
import { AuditPanel, StockPanel, TransactionPanel, WarehousePanel } from "./ShowcasePanels";
import { WindowFrame } from "./WindowFrame";

const views = [
  {
    id: "stock",
    label: "Estoque",
    url: "app.ironledger.com/inventory",
    caption: "Saldo por produto e por armazém, já com o reservado descontado, e a situação de cada item frente ao mínimo.",
    Panel: StockPanel,
  },
  {
    id: "transactions",
    label: "Transações",
    url: "app.ironledger.com/transactions/TXN-00483921",
    caption: "Cada transação é acompanhada etapa por etapa. Se algo falha, a compensação devolve o saldo.",
    Panel: TransactionPanel,
  },
  {
    id: "audit",
    label: "Auditoria",
    url: "app.ironledger.com/audit-log",
    caption: "Quem fez o quê e quando, com o valor antes e depois de cada alteração.",
    Panel: AuditPanel,
  },
  {
    id: "warehouses",
    label: "Armazéns",
    url: "app.ironledger.com/warehouses/CD-SP",
    caption: "Instalações e suas localizações em árvore: zonas, corredores, estantes e compartimentos.",
    Panel: WarehousePanel,
  },
] as const;

export function ProductShowcase() {
  const reducedMotion = useReducedMotion();
  const groupId = useId();
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const view = views[active]!;

  // Setas, Home e End movem a seleção, como em um controle segmentado nativo.
  const onKeyDown = (event: KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowRight: (active + 1) % views.length,
      ArrowLeft: (active - 1 + views.length) % views.length,
      Home: 0,
      End: views.length - 1,
    };
    const next = keys[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section id="platform" className="relative isolate z-10 px-5 py-20 md:px-10 md:py-32">
      <OrbField variant="cool" />
      <Reveal>
        <SectionHeading
          eyebrow="A plataforma"
          title="Cada parte da operação, em uma tela só dela"
          description="Estoque, transações, auditoria e armazéns usam os mesmos dados. O que muda em um lugar aparece nos outros."
        />
      </Reveal>

      <Reveal className="mx-auto max-w-[1060px]">
        <div className="mb-8 flex justify-center overflow-x-auto pb-1">
          <LayoutGroup id={groupId}>
            <div role="tablist" aria-label="Telas da plataforma" onKeyDown={onKeyDown} className="inline-flex gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl">
              {views.map((item, index) => {
                const selected = index === active;
                return (
                  <button
                    key={item.id}
                    ref={(element) => { tabRefs.current[index] = element; }}
                    type="button"
                    role="tab"
                    id={`tab-${item.id}`}
                    aria-selected={selected}
                    aria-controls="platform-panel"
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActive(index)}
                    className={`relative h-10 rounded-full px-5 text-[14px] font-medium tracking-[-0.01em] whitespace-nowrap outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary/60 motion-reduce:transition-none ${selected ? "text-foreground" : "text-white/60 hover:text-white/90"}`}
                  >
                    {selected && (
                      <motion.span
                        layoutId="showcase-tab"
                        aria-hidden
                        transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }}
                        className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.11] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                      />
                    )}
                    <span className="relative">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
        </div>

        <div id="platform-panel" role="tabpanel" aria-labelledby={`tab-${view.id}`}>
          <WindowFrame url={view.url} className="min-h-[420px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view.id}
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <view.Panel />
              </motion.div>
            </AnimatePresence>
          </WindowFrame>
          <p aria-live="polite" className="mx-auto mt-6 max-w-[620px] text-center text-[15.5px] leading-relaxed tracking-[-0.01em] text-white/65">{view.caption}</p>
          <p className="m-0 mt-2 text-center text-[12.5px] text-white/45">Prévia ilustrativa, com dados de exemplo.</p>
        </div>
      </Reveal>
    </section>
  );
}
