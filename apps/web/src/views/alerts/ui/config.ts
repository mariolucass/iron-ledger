import { Activity, AlertTriangle, Bell, Info, ShieldAlert, Zap } from "lucide-react";
import type { Severity, Source, Status } from "../model/types";

export const severityConfig = {
  CRITICAL: { label: "Crítico", icon: ShieldAlert, text: "text-destructive", soft: "bg-destructive-soft", border: "border-l-destructive" },
  WARNING: { label: "Aviso", icon: AlertTriangle, text: "text-warning", soft: "bg-warning-soft", border: "border-l-warning" },
  INFO: { label: "Informativo", icon: Info, text: "text-info", soft: "bg-info-soft", border: "border-l-info" },
} satisfies Record<Severity, { label: string; icon: typeof Activity; text: string; soft: string; border: string }>;

export const sourceConfig = {
  FORECASTING: { label: "Previsão AI", icon: Activity },
  TRANSACTIONS: { label: "Motor de Sagas", icon: Zap },
  INVENTORY: { label: "Estoque", icon: Activity },
  SECURITY: { label: "Segurança / Identidade", icon: ShieldAlert },
  SYSTEM: { label: "Infraestrutura", icon: Bell },
} satisfies Record<Source, { label: string; icon: typeof Activity }>;

export const statusConfig = {
  ACTIVE: { label: "Ativo", classes: "border-destructive/20 bg-destructive/10 text-destructive" },
  ACKNOWLEDGED: { label: "Reconhecido", classes: "border-warning/20 bg-warning/10 text-warning" },
  RESOLVED: { label: "Resolvido", classes: "border-primary/20 bg-primary/10 text-primary" },
} satisfies Record<Status, { label: string; classes: string }>;
