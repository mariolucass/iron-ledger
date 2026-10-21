"use client";

import { ChevronDown, Search } from "lucide-react";
import { useId, type ReactNode } from "react";

const fieldBase =
  "h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] text-[14.5px] tracking-[-0.01em] text-foreground outline-none backdrop-blur-xl transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-white/40 hover:border-white/20 focus:border-primary/70 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(0,229,160,0.12)] motion-reduce:transition-none";

/** Grade dos filtros; `columns` é a classe de colunas (ex.: "md:grid-cols-[1fr_200px_220px]"). */
export function FilterBar({ children, columns = "md:grid-cols-[1fr_200px_220px]" }: { children: ReactNode; columns?: string }) {
  return <div className={`mb-5 grid gap-3 ${columns}`}>{children}</div>;
}

export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Rótulo acessível; padrão: o placeholder. */
  label?: string;
}) {
  return (
    <div className="relative">
      <Search size={16} aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-white/45" />
      <input
        className={`${fieldBase} pr-4 pl-11`}
        type="search"
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function SelectField({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: readonly { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <div className="relative">
      <select id={id} className={`${fieldBase} cursor-pointer appearance-none pr-10 pl-4`} aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <ChevronDown size={16} aria-hidden className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-white/50" />
    </div>
  );
}

/** Abas em pílula de vidro (ex.: filtro por situação). */
export function SegmentedTabs<T extends string>({
  value,
  onChange,
  label,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  label: string;
  options: readonly { value: T; label: string }[];
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full flex-wrap gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={`h-9 cursor-pointer rounded-full border px-4 text-[14px] font-medium tracking-[-0.01em] whitespace-nowrap outline-none transition-[background-color,color,border-color] duration-150 focus-visible:ring-2 focus-visible:ring-primary/60 motion-reduce:transition-none ${selected ? "border-white/10 bg-white/[0.12] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" : "border-transparent bg-transparent text-white/60 hover:text-white/90"}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
