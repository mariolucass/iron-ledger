"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Fragment, useId, type MouseEvent, type ReactNode } from "react";
import { TableRowsSkeleton } from "../page-skeletons";

const hideBelow = { sm: "max-sm:hidden", md: "max-md:hidden", lg: "max-lg:hidden", xl: "max-xl:hidden" } as const;

const glass = "border border-ink/10 bg-ink/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl";

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
    <div className="md:overflow-hidden md:rounded-2xl md:border md:border-ink/10 md:bg-ink/[0.03] md:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:backdrop-blur-xl">
      {/* Celular: cada linha vira um cartão com todas as colunas (nenhum dado some, nada rola na horizontal). */}
      <ul aria-label={caption} aria-busy={loading} className={`m-0 grid list-none gap-3 p-0 transition-opacity duration-150 md:hidden motion-reduce:transition-none ${loading && rows.length ? "opacity-60" : ""}`}>
        {showSkeleton && [0, 1, 2].map((key) => (
          <li key={key} aria-hidden className={`h-28 animate-pulse rounded-2xl ${glass} motion-reduce:animate-none`} />
        ))}
        {rows.map((row) => {
          const key = getRowKey(row);
          const href = rowHref?.(row);
          const open = expandable?.isExpanded(row) ?? false;
          const detailId = `${idBase}-m-${key}`;
          const highlight = rowTone?.(row);
          const [first, ...rest] = columns;
          const title = first.cell(row);
          return (
            <li
              key={key}
              onClick={interactive ? (event) => handleRowClick(event, row) : undefined}
              className={`rounded-2xl border border-ink/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl ${highlight ? tone[highlight] : "bg-ink/[0.03]"} ${interactive ? "cursor-pointer active:bg-ink/[0.06]" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 text-[15px] font-medium break-words">
                  {href ? (
                    <Link href={href} className="rounded-md text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/60">{title}</Link>
                  ) : onRowClick ? (
                    <button type="button" onClick={() => onRowClick(row)} className="cursor-pointer rounded-md border-0 bg-transparent p-0 text-left text-inherit outline-none focus-visible:ring-2 focus-visible:ring-primary/60">{title}</button>
                  ) : (
                    title
                  )}
                </div>
                {expandable ? (
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={detailId}
                    aria-label={expandable.label(row)}
                    onClick={() => expandable.onToggle(row)}
                    className="grid size-10 shrink-0 -translate-y-1 translate-x-1 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-ink/55 outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  >
                    <ChevronRight size={18} aria-hidden className={`transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-90 text-primary" : ""}`} />
                  </button>
                ) : href ? (
                  <ChevronRight size={18} aria-hidden className="mt-0.5 shrink-0 text-ink/40" />
                ) : null}
              </div>
              {rest.length > 0 && (
                <dl className="m-0 mt-3 grid gap-2.5 border-t border-ink/[0.08] pt-3">
                  {rest.map((column) => (
                    <div key={column.id} className="flex items-baseline justify-between gap-4 text-[14px]">
                      <dt className="shrink-0 text-[12.5px] text-ink/55">{column.header}</dt>
                      <dd className={`m-0 min-w-0 text-right break-words ${column.className ?? ""}`}>{column.cell(row)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {open && expandable && (
                <div id={detailId} className="-mx-4 mt-4 -mb-4 rounded-b-2xl border-t border-ink/[0.08] border-l-2 border-l-primary/70 bg-sunken px-4 py-4">{expandable.render(row)}</div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="hidden overflow-x-auto md:block">
        <table style={{ minWidth }} className="w-full border-collapse text-left text-[14px]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-ink/[0.08] bg-ink/[0.025]">
              {expandable && <th scope="col" className="w-12 px-3 py-3.5"><span className="sr-only">Detalhes</span></th>}
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={`px-4 py-3 text-[12.5px] font-medium tracking-[-0.005em] text-ink/55 ${column.align === "right" ? "text-right" : ""} ${column.hideBelow ? hideBelow[column.hideBelow] : ""}`}
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
                    className={`border-b border-ink/[0.06] transition-colors duration-150 last:border-0 motion-reduce:transition-none ${highlight ? tone[highlight] : ""} ${interactive ? "cursor-pointer hover:bg-ink/[0.05] focus-within:bg-ink/[0.05]" : ""} ${open ? "bg-ink/[0.05]" : ""}`}
                  >
                    {expandable && (
                      <td className="w-12 px-3 py-4 text-center align-middle">
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-controls={detailId}
                          aria-label={expandable.label(row)}
                          onClick={() => expandable.onToggle(row)}
                          className="inline-grid size-8 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-ink/55 outline-none transition-colors hover:bg-ink/[0.08] hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60 motion-reduce:transition-none"
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
                          className={`px-4 py-4 align-middle ${column.align === "right" ? "text-right tabular-nums" : ""} ${column.hideBelow ? hideBelow[column.hideBelow] : ""} ${column.className ?? ""}`}
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
                    <tr id={detailId} className="border-b border-ink/[0.06] last:border-0">
                      <td colSpan={columnCount} className="p-0">
                        <div className="border-l-2 border-primary/70 bg-sunken px-6 py-4 md:pl-16">{expandable.render(row)}</div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {showEmpty && <div className="max-md:rounded-2xl max-md:border max-md:border-ink/10 max-md:bg-ink/[0.03] md:contents">{empty}</div>}
    </div>
  );
}
