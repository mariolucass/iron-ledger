import { colors as theme } from "@/shared/config/tokens";
import type { AuditAction } from "../model/types";
import { auditActionLabels } from "../model/presentation";

const actionTheme: Record<
  string,
  { text: string; bg: string; border: string }
> = {
  CREATE: {
    text: theme.accent,
    bg: theme.accentGlow,
    border: `${theme.accent}40`,
  },
  UPDATE: {
    text: theme.info,
    bg: "rgba(59, 130, 246, 0.15)",
    border: "rgba(59, 130, 246, 0.4)",
  },
  DELETE: {
    text: theme.danger,
    bg: theme.dangerGlow,
    border: `${theme.danger}40`,
  },
  LOGIN: {
    text: theme.textPrimary,
    bg: theme.surfaceHover,
    border: theme.border,
  },
  PERMISSION_CHANGE: {
    text: theme.warning,
    bg: "rgba(245, 166, 35, 0.15)",
    border: "rgba(245, 166, 35, 0.4)",
  },
};

export function AuditActionBadge({ action }: { action: AuditAction }) {
  const style = actionTheme[action] || actionTheme.LOGIN;
  const label = auditActionLabels[action] || action;
  return (
    <span
      style={{
        background: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        borderRadius: 999,
        padding: "2px 10px",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}
