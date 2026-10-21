import { AlertTriangle } from "lucide-react";

export function ListError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/35 bg-destructive-soft px-4 py-3 text-[14px] text-destructive">
      <AlertTriangle size={16} aria-hidden className="shrink-0" />
      <span className="min-w-0 flex-1">{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="cursor-pointer rounded-full border border-destructive/40 bg-transparent px-3.5 py-1 text-[13px] font-medium text-destructive outline-none hover:bg-destructive/15 focus-visible:ring-2 focus-visible:ring-destructive/50">
          Tentar novamente
        </button>
      )}
    </div>
  );
}
