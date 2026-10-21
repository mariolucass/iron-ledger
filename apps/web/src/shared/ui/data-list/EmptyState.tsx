import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Lista vazia, com ícone, mensagem e uma ação opcional. */
export function EmptyState({ icon: Icon, message, action }: { icon: LucideIcon; message: ReactNode; action?: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-4 px-6 py-16 text-center">
      <span aria-hidden className="grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/50"><Icon size={26} strokeWidth={1.6} /></span>
      <p className="m-0 max-w-[420px] text-[15px] leading-relaxed text-white/60">{message}</p>
      {action}
    </div>
  );
}
