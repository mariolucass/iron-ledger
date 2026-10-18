import { Badge } from "@/shared/ui/kit/badge";
import type { StockMovementType } from "../model/types";

const labels: Record<StockMovementType, string> = {
  INBOUND: "Entrada",
  OUTBOUND: "Saída",
  ADJUSTMENT: "Ajuste",
  RETURN: "Retorno",
  TRANSFER: "Transferência",
  RESERVATION: "Reserva",
  RELEASE: "Liberação",
};

export function StockMovementLabel({ type }: { type: StockMovementType }) {
  return (
    <Badge
      variant={
        type === "OUTBOUND"
          ? "destructive"
          : type === "ADJUSTMENT"
            ? "warning"
            : "success"
      }
    >
      {labels[type]}
    </Badge>
  );
}
