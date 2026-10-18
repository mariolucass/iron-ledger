"use client";

import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number, active: boolean, duration = 1_800) {
  const [count, setCount] = useState(0);
  const animationFrame = useRef<number | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!active || hasStarted.current) return;

    hasStarted.current = true;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      setCount(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) animationFrame.current = requestAnimationFrame(tick);
    };

    animationFrame.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
    };
  }, [active, duration, target]);

  return count.toLocaleString("pt-BR");
}
