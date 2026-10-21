import { Badge } from "@/shared/ui/kit/badge";
import type { AuditAction } from "../model/types";
import { auditActionLabels } from "../model/presentation";

const variant = {
  CREATE: "success",
  UPDATE: "info",
  DELETE: "destructive",
  LOGIN: "outline",
  PERMISSION_CHANGE: "warning",
} as const satisfies Record<AuditAction, string>;

export function AuditActionBadge({ action }: { action: AuditAction }) {
  return <Badge variant={variant[action] ?? "outline"}>{auditActionLabels[action] ?? action}</Badge>;
}
