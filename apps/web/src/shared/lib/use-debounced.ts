"use client";

import { useEffect, useState } from "react";

/** Devolve `value` só depois que ele ficar estável por `delay` ms (ex.: campo de busca). */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
