"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import type { PreferencesPatch, Profile } from "@/entities/user";
import { Panel, StatusMessage, Switch, type Status } from "@/shared/ui/form-primitives";

export function NotificationsPanel({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (patch: PreferencesPatch) => Promise<void>;
}) {
  const [status, setStatus] = useState<Status>(null);
  const { emailAlerts, slackAlerts } = profile.preferences.notifications;

  const toggle = async (patch: Partial<Profile["preferences"]["notifications"]>) => {
    setStatus(null);
    try {
      await onSave({ notifications: patch });
    } catch (reason) {
      setStatus({ type: "error", message: reason instanceof Error ? reason.message : "Não foi possível salvar a preferência." });
    }
  };

  return (
    <Panel title="Preferências de Notificação">
      <div className="grid gap-4">
        <Switch
          label="Alertas por Email"
          description="Receber resumos diários e alertas de anomalias no sistema."
          checked={emailAlerts}
          onChange={(next) => void toggle({ emailAlerts: next })}
        />
        <Switch
          label="Integração com Slack"
          description="Enviar notificações em tempo real de falhas nas Sagas e rupturas de stock para o canal #ops-alerts."
          checked={slackAlerts}
          onChange={(next) => void toggle({ slackAlerts: next })}
        />
        <StatusMessage status={status} />
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-lg border border-info/30 bg-info-soft p-4">
        <Bell size={18} className="mt-0.5 shrink-0 text-info" aria-hidden />
        <div>
          <div className="mb-1 text-[13px] font-semibold text-info">Notificações In-App Ativas</div>
          <div className="text-[13px] leading-normal text-muted-foreground">
            Os alertas críticos (como Falhas de Compensação ou Previsão de Ruptura) não podem ser desativados e
            aparecerão sempre na barra superior do painel.
          </div>
        </div>
      </div>
    </Panel>
  );
}
