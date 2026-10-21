import type { LucideIcon } from "lucide-react";

/** Indicador de vidro com ícone, rótulo e valor. */
export function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="relative flex items-center gap-4 overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
      <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/25 bg-primary-soft text-primary"><Icon size={21} strokeWidth={1.7} /></span>
      <div className="min-w-0">
        <div className="text-[13px] text-white/60">{label}</div>
        <div className="truncate text-[26px] leading-tight font-semibold tracking-[-0.03em] text-foreground tabular-nums">{value}</div>
      </div>
    </div>
  );
}
