"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion";
import type { PointerEvent } from "react";

/** Cursor normalizado em -0.5..0.5 e suavizado por mola. Desligado em touch e com movimento reduzido. */
export function usePointerParallax() {
  const reducedMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, { stiffness: 60, damping: 20 });
  const y = useSpring(pointerY, { stiffness: 60, damping: 20 });

  return {
    x,
    y,
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (reducedMotion || event.pointerType === "touch") return;
      const rect = event.currentTarget.getBoundingClientRect();
      pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
      pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
    },
    onPointerLeave: () => {
      pointerX.set(0);
      pointerY.set(0);
    },
  };
}

export type OrbColor = "green" | "blue" | "violet" | "pink";

const paint: Record<OrbColor, string> = {
  green: "bg-[radial-gradient(circle_at_40%_40%,#00e5a0,transparent_68%)]",
  blue: "bg-[radial-gradient(circle_at_50%_50%,#60a5fa,transparent_68%)]",
  violet: "bg-[radial-gradient(circle_at_50%_50%,#a78bfa,transparent_68%)]",
  pink: "bg-[radial-gradient(circle_at_50%_50%,#f472b6,transparent_68%)]",
};

const drift = [
  "animate-[orb-drift-a_16s_ease-in-out_infinite]",
  "animate-[orb-drift-b_19s_ease-in-out_infinite]",
  "animate-[orb-drift-c_22s_ease-in-out_infinite]",
  "animate-[orb-drift-a_14s_ease-in-out_infinite_reverse]",
];

interface OrbProps {
  color: OrbColor;
  /** Posição e tamanho (classes Tailwind), ex.: "-top-40 -left-32 size-[440px]". */
  position: string;
  opacity?: number;
  /** Índice da animação de deriva, para os orbes não andarem em sincronia. */
  motion?: 0 | 1 | 2 | 3;
  blur?: number;
}

/** Orbe estático: luz colorida desfocada que deriva devagar. */
export function Orb({ color, position, opacity = 0.6, motion: m = 0, blur = 70 }: OrbProps) {
  return (
    <div aria-hidden className={`pointer-events-none absolute ${position}`}>
      <div
        style={{ opacity, filter: `blur(${blur}px)` }}
        className={`size-full rounded-full mix-blend-screen in-data-[theme=light]:mix-blend-normal motion-reduce:animate-none ${paint[color]} ${drift[m]}`}
      />
    </div>
  );
}

interface ParallaxOrbProps extends OrbProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** Intensidade do paralaxe em px; sinal negativo move no sentido oposto ao cursor. */
  depth: number;
}

/** Orbe que também reage ao cursor. Duas camadas para não brigar por `transform`. */
export function ParallaxOrb({ x, y, depth, ...orb }: ParallaxOrbProps) {
  const translateX = useTransform(x, (value) => value * depth);
  const translateY = useTransform(y, (value) => value * depth);
  return (
    <motion.div aria-hidden style={{ x: translateX, y: translateY }} className="pointer-events-none absolute inset-0">
      <Orb {...orb} />
    </motion.div>
  );
}

/** Conjunto pronto de orbes de fundo para uma seção. */
export function OrbField({ variant }: { variant: "aurora" | "cool" | "warm" }) {
  const sets = {
    aurora: [
      <Orb key="a" color="green" position="-top-32 -left-24 size-[420px]" opacity={0.28} motion={0} blur={90} />,
      <Orb key="b" color="violet" position="top-1/3 -right-32 size-[460px]" opacity={0.26} motion={2} blur={90} />,
    ],
    cool: [
      <Orb key="a" color="blue" position="-top-24 left-[8%] size-[400px]" opacity={0.26} motion={1} blur={90} />,
      <Orb key="b" color="violet" position="bottom-0 right-[6%] size-[440px]" opacity={0.24} motion={3} blur={90} />,
    ],
    warm: [
      <Orb key="a" color="pink" position="-top-20 right-[10%] size-[360px]" opacity={0.2} motion={0} blur={90} />,
      <Orb key="b" color="green" position="bottom-0 left-[6%] size-[420px]" opacity={0.24} motion={2} blur={90} />,
    ],
  };
  return <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">{sets[variant]}</div>;
}
