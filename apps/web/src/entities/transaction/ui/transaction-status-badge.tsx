import { Badge } from "@/shared/ui/kit/badge";
import type { SagaStepStatus, TransactionStatus } from "../model/types";

const transactionPresentation = {
  PENDING: { label: "Na fila", variant: "outline" },
  PROCESSING: { label: "Processando", variant: "info" },
  COMPENSATING: { label: "Compensando", variant: "warning" },
  COMPLETED: { label: "Concluída", variant: "success" },
  COMPENSATED: { label: "Compensada", variant: "warning" },
  FAILED: { label: "Falhou", variant: "destructive" },
  CANCELLED: { label: "Cancelada", variant: "secondary" },
} as const satisfies Record<TransactionStatus, { label: string; variant: string }>;

export function transactionStatusLabel(status: TransactionStatus): string {
  return transactionPresentation[status].label;
}

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  const { label, variant } = transactionPresentation[status];
  const live = status === "PENDING" || status === "PROCESSING" || status === "COMPENSATING";
  return (
    <Badge variant={variant}>
      {live && <span aria-hidden className="inline-block size-1.5 animate-pulse rounded-full bg-current" />}
      {label}
    </Badge>
  );
}

const stepNames: Record<string, string> = {
  reserveStock: "Reservar estoque",
  confirmTransaction: "Confirmar baixa",
  reconcileReservation: "Reconciliar reserva",
  compensateStock: "Liberar reserva",
};

export function sagaStepLabel(name: string): string {
  return stepNames[name] ?? name;
}

const stepPresentation = {
  SCHEDULED: { label: "Agendado", variant: "outline" },
  RUNNING: { label: "Em execução", variant: "info" },
  SUCCEEDED: { label: "Concluído", variant: "success" },
  FAILED: { label: "Falhou", variant: "destructive" },
  SKIPPED: { label: "Ignorado", variant: "secondary" },
  TIMED_OUT: { label: "Expirou", variant: "destructive" },
} as const satisfies Record<SagaStepStatus, { label: string; variant: string }>;

export function SagaStepStatusBadge({ status }: { status: SagaStepStatus }) {
  const { label, variant } = stepPresentation[status];
  return <Badge variant={variant}>{label}</Badge>;
}
