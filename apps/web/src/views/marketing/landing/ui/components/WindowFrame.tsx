import { Lock } from "lucide-react";
import type { ReactNode } from "react";

/** Janela de aplicativo (estilo macOS) que enquadra as prévias do produto. */
export function WindowFrame({ url, children, className = "" }: { url: string; children: ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-[22px] border border-ink/[0.12] bg-panel/90 shadow-elevated backdrop-blur-xl md:rounded-[28px] ${className}`}
    >
      <div className="flex h-12 items-center gap-4 border-b border-ink/[0.08] bg-ink/[0.03] px-4 md:px-5">
        <div aria-hidden className="flex gap-1.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="mx-auto flex h-7 max-w-[380px] flex-1 items-center justify-center gap-1.5 rounded-full border border-ink/10 bg-ink/[0.04] px-3 text-[12px] text-ink/55">
          <Lock size={11} aria-hidden />
          <span className="truncate">{url}</span>
        </div>
        <span aria-hidden className="w-[54px] max-md:hidden" />
      </div>
      {children}
    </div>
  );
}
