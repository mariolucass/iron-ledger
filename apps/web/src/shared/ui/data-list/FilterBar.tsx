"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";
import { Children, Fragment, useId, type ReactNode } from "react";
import { SelectInput } from "../kit/select";

const fieldBase =
  "h-11 w-full rounded-full border border-ink/10 bg-ink/[0.04] text-[14.5px] tracking-[-0.01em] text-foreground outline-none backdrop-blur-xl transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-ink/40 hover:border-ink/20 focus:border-primary/70 focus:bg-ink/[0.06] focus:shadow-[0_0_0_4px_rgba(0,229,160,0.12)] motion-reduce:transition-none";

/** Grade dos filtros; `columns` é a classe de colunas (ex.: "md:grid-cols-[1fr_200px_220px]"). */
export function FilterBar({
  children,
  columns = "md:grid-cols-[1fr_200px_220px]",
}: {
  children: ReactNode;
  columns?: string;
}) {
  // No celular: busca em linha própria e os seletores lado a lado (2 colunas), em vez de uma pilha de campos largos.
  const paired = Children.count(children) >= 3;
  const mobile = paired
    ? "grid-cols-2 [&>:first-child]:col-span-2 md:[&>:first-child]:col-span-1"
    : "grid-cols-1";
  return <div className={`mb-5 grid gap-3 md:mb-6 md:gap-4 ${mobile} ${columns}`}>{children}</div>;
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
      <Search
        size={16}
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink/45"
      />
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
  return (
    <SelectInput
      aria-label={label}
      value={value}
      onChange={onChange}
      options={options}
      className={`${fieldBase} h-11 rounded-full pr-4 pl-4 data-[size=default]:h-11 data-[state=open]:border-primary/70 data-[state=open]:ring-0 data-[state=open]:shadow-[0_0_0_4px_rgba(0,229,160,0.12)]`}
    />
  );
}

/**
 * Abas em pílula de vidro (ex.: filtro por situação).
 * No celular viram pílulas soltas e centralizadas em pirâmide invertida (mais itens em cima, menos embaixo),
 * sem rolagem horizontal; a partir de `sm` ficam numa única cápsula.
 * O destaque da aba ativa desliza entre as pílulas (layout animation com mola); o toque comprime a pílula.
 */
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
  const reduced = useReducedMotion();
  const group = useId();
  // Quebra após a metade de cima (arredondada para cima): 5 vira 3 + 2, 4 vira 2 + 2.
  const breakAfter = options.length > 3 ? Math.ceil(options.length / 2) - 1 : -1;
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex max-w-full flex-wrap justify-center gap-2 sm:inline-flex sm:justify-start sm:gap-1 sm:rounded-full sm:border sm:border-ink/10 sm:bg-ink/[0.04] sm:p-1 sm:backdrop-blur-xl"
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <Fragment key={option.value}>
            <motion.button
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(option.value)}
              whileTap={reduced ? undefined : { scale: 0.95 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={`relative h-10 cursor-pointer rounded-full border px-4 text-[14px] font-medium tracking-[-0.01em] whitespace-nowrap outline-none transition-[color,border-color,background-color] duration-200 focus-visible:ring-2 focus-visible:ring-primary/60 motion-reduce:transition-none sm:h-9 ${selected ? "border-transparent text-foreground" : "border-ink/10 bg-ink/[0.04] text-ink/60 hover:text-ink/90 sm:border-transparent sm:bg-transparent"}`}
            >
              {selected && (
                <motion.span
                  layoutId={`${group}-tab-highlight`}
                  aria-hidden
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 34, mass: 0.9 }
                  }
                  className="absolute inset-0 rounded-full border border-ink/15 bg-ink/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_14px_rgba(0,0,0,0.25)]"
                />
              )}
              <span className="relative">{option.label}</span>
            </motion.button>
            {index === breakAfter && <span aria-hidden className="h-0 basis-full sm:hidden" />}
          </Fragment>
        );
      })}
    </div>
  );
}
