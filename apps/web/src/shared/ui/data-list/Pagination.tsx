"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const buttonClass =
  "grid size-10 cursor-pointer place-items-center rounded-full border border-white/10 bg-white/[0.05] text-white/80 outline-none backdrop-blur-xl transition-[background-color,transform] duration-150 hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none motion-reduce:active:scale-100";

/** Contagem de registros e navegação entre páginas. Os botões só aparecem quando há mais de uma página. */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  noun,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** [singular, plural], ex.: ["produto", "produtos"]. */
  noun: readonly [string, string];
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[14px] text-white/60">
      <span>{total} {total === 1 ? noun[0] : noun[1]}</span>
      {pages > 1 && (
        <nav aria-label="Paginação" className="flex items-center gap-3">
          <button type="button" aria-label="Página anterior" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className={buttonClass}><ChevronLeft size={17} aria-hidden /></button>
          <span className="tabular-nums" aria-live="polite">Página {page} de {pages}</span>
          <button type="button" aria-label="Próxima página" disabled={page >= pages} onClick={() => onPageChange(page + 1)} className={buttonClass}><ChevronRight size={17} aria-hidden /></button>
        </nav>
      )}
    </div>
  );
}
