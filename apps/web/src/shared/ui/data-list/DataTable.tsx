"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Fragment, useId, type MouseEvent, type ReactNode } from "react";
import { TableRowsSkeleton } from "../page-skeletons";

const hideBelow = { sm: "max-sm:hidden", md: "max-md:hidden", lg: "max-lg:hidden", xl: "max-xl:hidden" } as const;

const tone = { danger: "bg-destructive-soft/60", warning: "bg-warning-soft/50" } as const;

export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  /** Esconde a coluna em telas menores que o breakpoint. */
  hideBelow?: keyof typeof hideBelow;
  /** Classe extra aplicada às células (ex.: "font-mono"). */
  className?: string;
}

/** Linhas que abrem um painel de detalhe logo abaixo (ex.: últimos movimentos). */
export interface Expandable<T> {
  isExpanded: (row: T) => boolean;
  onToggle: (row: T) => void;
  render: (row: T) => ReactNode;
  /** Texto do botão de expandir, para leitores de tela. */
  label: (row: T) => string;
}

interface DataTableProps<T> {
  columns: readonly Column<T>[];
  rows: readonly T[];
  getRowKey: (row: T) => string;
  /** Torna a linha clicável. A primeira coluna vira um link, para teclado e leitores de tela. */
  rowHref?: (row: T) => Route;
  /** Alternativa a `rowHref`: a linha abre um detalhe embutido. */
  expandable?: Expandable<T>;
  /** Alternativa a `rowHref`: ação ao clicar na linha (ex.: abrir uma gaveta). A primeira coluna vira um botão. */
  onRowClick?: (row: T) => void;
  /** Realça linhas que pedem atenção (ex.: estoque crítico). */
  rowTone?: (row: T) => keyof typeof tone | undefined;
  loading?: boolean;
  /** Mostrado no lugar da tabela quando não há linhas e nada está carregando. */
  empty?: ReactNode;
  /** Largura mínima antes de rolar na horizontal. */
  minWidth?: number;
  caption: string;
}

/** Tabela de vidro para listas. Não conhece domínio: recebe colunas e linhas. */
export function DataTable<T>({ columns, rows, getRowKey, rowHref, expandable, onRowClick, rowTone, loading = false, empty, minWidth = 720, caption }: DataTableProps<T>) {
  const router = useRouter();
  const idBase = useId();
  const columnCount = columns.length + (expandable ? 1 : 0);
  const showSkeleton = loading && rows.length === 0;
  const showEmpty = !loading && rows.length === 0 && empty;

  const handleRowClick = (event: MouseEvent, row: T) => {
    // Cliques em links/botões dentro da linha seguem o comportamento próprio deles.
    if ((event.target as HTMLElement).closest("a,button,input,select")) return;
    if (expandable) expandable.onToggle(row);
    else if (onRowClick) onRowClick(row);
    else if (rowHref) router.push(rowHref(row));
  };
  const interactive = Boolean(rowHref || expandable || onRowClick);

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table style={{ minWidth }} className="w-full border-collapse text-left text-[14px]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.025]">
              {expandable && <th scope="col" className="w-12 px-3 py-3.5"><span className="sr-only">Detalhes</span></th>}
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={`px-5 py-3.5 text-[12.5px] font-medium tracking-[-0.005em] text-white/55 ${column.align === "right" ? "text-right" : ""} ${column.hideBelow ? hideBelow[column.hideBelow] : ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`transition-opacity duration-150 motion-reduce:transition-none ${loading && rows.length ? "opacity-60" : ""}`} aria-busy={loading}>
            {showSkeleton && <TableRowsSkeleton columns={columnCount} />}
            {rows.map((row) => {
              const key = getRowKey(row);
              const href = rowHref?.(row);
              const open = expandable?.isExpanded(row) ?? false;
              const detailId = `${idBase}-${key}`;
              const highlight = rowTone?.(row);
              return (
                <Fragment key={key}>
                  <tr
                    onClick={interactive ? (event) => handleRowClick(event, row) : undefined}
                    className={`border-b border-white/[0.06] transition-colors duration-150 last:border-0 motion-reduce:transition-none ${highlight ? tone[highlight] : ""} ${interactive ? "cursor-pointer hover:bg-white/[0.05] focus-within:bg-white/[0.05]" : ""} ${open ? "bg-white/[0.05]" : ""}`}
                  >
                    {expandable && (
                      <td className="w-12 px-3 py-4 text-center align-middle">
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-controls={detailId}
                          aria-label={expandable.label(row)}
                          onClick={() => expandable.onToggle(row)}
                          className="inline-grid size-8 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-white/55 outline-none transition-colors hover:bg-white/[0.08] hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60 motion-reduce:transition-none"
                        >
                          <ChevronRight size={17} aria-hidden className={`transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-90 text-primary" : ""}`} />
                        </button>
                      </td>
                    )}
                    {columns.map((column, index) => {
                      const content = column.cell(row);
                      return (
                        <td
                          key={column.id}
                          className={`px-5 py-4 align-middle ${column.align === "right" ? "text-right tabular-nums" : ""} ${column.hideBelow ? hideBelow[column.hideBelow] : ""} ${column.className ?? ""}`}
                        >
                          {href && index === 0 ? (
                            <Link href={href} className="rounded-md text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/60">
                              {content}
                            </Link>
                          ) : onRowClick && index === 0 ? (
                            <button type="button" onClick={() => onRowClick(row)} className="cursor-pointer rounded-md border-0 bg-transparent p-0 text-left text-inherit outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/60">
                              {content}
                            </button>
                          ) : (
                            content
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  {open && expandable && (
                    <tr id={detailId} className="border-b border-white/[0.06] last:border-0">
                      <td colSpan={columnCount} className="p-0">
                        <div className="border-l-2 border-primary/70 bg-black/25 py-5 pr-5 pl-6 md:pl-[4.25rem]">{expandable.render(row)}</div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {showEmpty && empty}
    </div>
  );
}
