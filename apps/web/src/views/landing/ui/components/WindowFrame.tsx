import { Lock } from "lucide-react";
import type { ReactNode } from "react";

/** Janela de aplicativo (estilo macOS) que enquadra as prévias do produto. */
export function WindowFrame({ url, children, className = "" }: { url: string; children: ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-[22px] border border-white/[0.12] bg-[#0b0c0e]/90 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:rounded-[28px] ${className}`}
    >
      <div className="flex h-12 items-center gap-4 border-b border-white/[0.08] bg-white/[0.03] px-4 md:px-5">
        <div aria-hidden className="flex gap-1.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="mx-auto flex h-7 max-w-[380px] flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-[12px] text-white/55">
          <Lock size={11} aria-hidden />
          <span className="truncate">{url}</span>
        </div>
        <span aria-hidden className="w-[54px] max-md:hidden" />
      </div>
      {children}
    </div>
  );
}
