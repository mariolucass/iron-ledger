import { Badge } from "@/shared/ui/kit/badge";
import type { ProductStatus, TrackingMode } from "../model/types";

export const productStatusLabel: Record<ProductStatus, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativo",
  DISCONTINUED: "Descontinuado",
  ARCHIVED: "Arquivado",
};

export const trackingModeLabel: Record<TrackingMode, string> = {
  NONE: "Sem rastreio",
  LOT: "Por lote",
  SERIAL: "Por número de série",
};

const variant = {
  DRAFT: "outline",
  ACTIVE: "success",
  DISCONTINUED: "warning",
  ARCHIVED: "secondary",
} as const satisfies Record<ProductStatus, string>;

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <Badge variant={variant[status]}>{productStatusLabel[status]}</Badge>;
}
