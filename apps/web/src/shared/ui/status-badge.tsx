import { actionColors, statusColors } from "@/shared/config/tokens";

interface StatusBadgeProps {
  status: string;
  type?: "status" | "action";
  pulse?: boolean;
}

export function StatusBadge({ status, type = "status", pulse = false }: StatusBadgeProps) {
  const map = type === "action" ? actionColors : statusColors;
  const color = map[status] ?? { bg: "var(--muted)", text: "var(--muted-foreground)" };
  const label = type === "status" ? (statusColors[status]?.label ?? status) : status;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.05em] uppercase"
      style={{ background: color.bg, color: color.text }}
    >
      {pulse && status === "PROCESSING" && (
        <span className="inline-block size-1.5 animate-[pulse-dot_1.5s_ease-in-out_infinite] rounded-full bg-info" />
      )}
      {label}
    </span>
  );
}
