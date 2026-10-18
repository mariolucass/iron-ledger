import { Badge } from "@/shared/ui/kit/badge";
import type { InventoryStatus } from "../model/types";

const presentation = {
  CRITICAL: { label: "Crítico", variant: "destructive" },
  LOW: { label: "Baixo", variant: "warning" },
  OK: { label: "Normal", variant: "success" },
} as const;

export function InventoryStatusBadge({ status }: { status: InventoryStatus }) {
  const { label, variant } = presentation[status];
  return <Badge variant={variant}>{label}</Badge>;
}
