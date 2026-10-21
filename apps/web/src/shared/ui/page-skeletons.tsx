import type { ReactNode } from "react";
import { Skeleton } from "./kit/skeleton";

/** Announces the loading state once; the skeleton blocks themselves are aria-hidden. */
export function PageLoading({ children, label = "Carregando…" }: { children: ReactNode; label?: string }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="grid gap-6">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function HeaderSkeleton({ action = true }: { action?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="grid gap-2.5">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {action && <Skeleton className="h-10 w-40 rounded-lg" />}
    </div>
  );
}

export function FiltersSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_200px_220px]">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className={`h-11 rounded-lg ${index === 0 ? "" : "max-md:hidden"}`} />
      ))}
    </div>
  );
}

export function KpiSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
          <Skeleton className="size-11 rounded-lg" />
          <div className="grid flex-1 gap-2.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Placeholder rows for an existing `<tbody>`, so the real header stays visible. */
export function TableRowsSkeleton({ columns, rows = 6 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, row) => (
        <tr key={row} aria-hidden className="border-b border-border last:border-0">
          {Array.from({ length: columns }, (_, column) => (
            <td key={column} className="px-5 py-4">
              <Skeleton className={`h-4 ${column === 0 ? "w-32" : column === columns - 1 ? "w-20" : "w-24"}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function TableSkeleton({ columns = 5, rows = 8 }: { columns?: number; rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex gap-6 border-b border-border px-4 py-3.5">
        {Array.from({ length: columns }, (_, index) => <Skeleton key={index} className="h-3 w-20" />)}
      </div>
      <table className="w-full border-collapse">
        <tbody><TableRowsSkeleton columns={columns} rows={rows} /></tbody>
      </table>
    </div>
  );
}

export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`grid gap-4 rounded-xl border border-border bg-card p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-2.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="grid grid-cols-4 gap-2 border-t border-border pt-4">
        {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="mx-auto h-8 w-full" />)}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
      {Array.from({ length: count }, (_, index) => <CardSkeleton key={index} />)}
    </div>
  );
}

function FieldSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className={`grid gap-2 ${wide ? "md:col-span-2" : ""}`}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-11 rounded-lg" />
    </div>
  );
}

export function FormSkeleton({ sections = 3 }: { sections?: number }) {
  return (
    <div className="grid max-w-[960px] gap-6">
      {Array.from({ length: sections }, (_, section) => (
        <div key={section} className="rounded-xl border border-border bg-card p-6">
          <Skeleton className="h-5 w-40" />
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton wide={section === 0} />
            {section !== 0 && <FieldSkeleton />}
          </div>
        </div>
      ))}
      <div className="flex justify-end gap-3">
        <Skeleton className="h-11 w-24 rounded-lg" />
        <Skeleton className="h-11 w-44 rounded-lg" />
      </div>
    </div>
  );
}

/** Back link + title + badges, as used by create/edit and detail pages. */
export function DetailHeaderSkeleton() {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-72 max-w-full" />
      <Skeleton className="h-4 w-56 max-w-full" />
    </div>
  );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid max-w-[960px] grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="grid gap-2.5 rounded-xl border border-border bg-card p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ className = "h-72" }: { className?: string }) {
  return (
    <div className="grid gap-4 rounded-xl border border-border bg-card p-5">
      <Skeleton className="h-5 w-44" />
      <Skeleton className={`${className} w-full rounded-lg`} />
    </div>
  );
}

export function PanelSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="grid gap-4 rounded-xl border border-border bg-card p-6">
      <Skeleton className="h-5 w-48" />
      {Array.from({ length: rows }, (_, index) => <Skeleton key={index} className="h-14 w-full rounded-lg" />)}
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="grid max-w-[1200px] items-start gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
      <div className="grid gap-2 rounded-xl border border-border bg-card p-3">
        {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-11 rounded-lg" />)}
      </div>
      <div className="min-h-[500px] rounded-xl border border-border bg-card p-6 md:p-10">
        <Skeleton className="h-6 w-56" />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton wide />
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
      </div>
    </div>
  );
}
