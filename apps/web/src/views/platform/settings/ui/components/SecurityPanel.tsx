"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ChangePasswordInput, PreferencesPatch, Profile } from "@/entities/user";
import { Button } from "@/shared/ui/kit/button";
import { Form, FormFieldRow } from "@/shared/ui/kit/form";
import {
  Field,
  Panel,
  StatusMessage,
  SubHeading,
  Switch,
  inputClass,
  type Status,
} from "@/shared/ui/form-primitives";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    newPassword: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres.")
      .max(72, "A senha deve ter no máximo 72 caracteres."),
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem.",
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ["newPassword"],
    message: "A nova senha deve ser diferente da atual.",
  });

type PasswordValues = z.infer<typeof passwordSchema>;

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const IPV6 = /^[0-9a-f:.]+$/i;
const isIp = (value: string) => IPV4.test(value) || (value.includes(":") && IPV6.test(value));

function parseIps(text: string): string[] {
  return text
    .split(/[\s,]+/)
    .map((ip) => ip.trim())
    .filter(Boolean);
}

function PasswordForm({ onSubmit }: { onSubmit: (input: ChangePasswordInput) => Promise<void> }) {
  const [status, setStatus] = useState<Status>(null);
  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const {
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting },
  } = form;

  const submit = handleSubmit(async ({ currentPassword, newPassword }) => {
    setStatus(null);
    try {
      await onSubmit({ currentPassword, newPassword });
      reset();
      setStatus({ type: "success", message: "Senha alterada com sucesso." });
    } catch (reason) {
      setStatus({
        type: "error",
        message: reason instanceof Error ? reason.message : "Não foi possível alterar a senha.",
      });
    }
  });

  return (
    <Form {...form}>
      <form
        onSubmit={submit}
        noValidate
        className="grid gap-5 rounded-lg border border-border bg-background p-5"
      >
        <FormFieldRow control={control} name="currentPassword" label="Senha atual">
          {(field) => (
            <input
              {...field}
              className={inputClass}
              type="password"
              autoComplete="current-password"
            />
          )}
        </FormFieldRow>
        <div className="grid gap-5 md:grid-cols-2">
          <FormFieldRow control={control} name="newPassword" label="Nova senha">
            {(field) => (
              <input
                {...field}
                className={inputClass}
                type="password"
                autoComplete="new-password"
              />
            )}
          </FormFieldRow>
          <FormFieldRow control={control} name="confirmPassword" label="Confirmar nova senha">
            {(field) => (
              <input
                {...field}
                className={inputClass}
                type="password"
                autoComplete="new-password"
              />
            )}
          </FormFieldRow>
        </div>
        <StatusMessage status={status} />
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            <KeyRound /> {isSubmitting ? "Alterando…" : "Alterar senha"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function IpRestriction({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (patch: PreferencesPatch) => Promise<void>;
}) {
  const { strictIp, allowedIps } = profile.preferences.security;
  const [text, setText] = useState(allowedIps.join("\n"));
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);

  const run = async (patch: PreferencesPatch) => {
    setStatus(null);
    try {
      await onSave(patch);
      return true;
    } catch (reason) {
      setStatus({
        type: "error",
        message: reason instanceof Error ? reason.message : "Não foi possível salvar.",
      });
      return false;
    }
  };

  const saveIps = async () => {
    const ips = parseIps(text);
    const invalid = ips.find((ip) => !isIp(ip));
    if (invalid) {
      setStatus({ type: "error", message: `Endereço IP inválido: ${invalid}` });
      return;
    }
    setSaving(true);
    if (await run({ security: { allowedIps: ips } })) {
      setText(ips.join("\n"));
      setStatus({ type: "success", message: "Lista de IPs salva." });
    }
    setSaving(false);
  };

  const dirty = parseIps(text).join(",") !== allowedIps.join(",");

  return (
    <div className="grid gap-4">
      <Switch
        label="Restrição de IP (Strict IP Binding)"
        description="Limita o acesso apenas aos endereços IP da lista abaixo. A preferência é salva na sua conta, mas ainda não é aplicada no login."
        checked={strictIp}
        onChange={(next) => void run({ security: { strictIp: next } })}
        badge="Aplicação em breve"
      />
      <Field label="IPs permitidos" hint="Um por linha (IPv4 ou IPv6).">
        {(props) => (
          <textarea
            {...props}
            className={`${inputClass} min-h-28 py-3 font-mono`}
            value={text}
            onChange={(event) => setText(event.target.value)}
            spellCheck={false}
            placeholder={"203.0.113.10\n198.51.100.0"}
          />
        )}
      </Field>
      <StatusMessage status={status} />
      <div className="flex justify-end">
        <Button type="button" size="lg" disabled={!dirty || saving} onClick={() => void saveIps()}>
          <Save /> {saving ? "Salvando…" : "Salvar lista"}
        </Button>
      </div>
    </div>
  );
}

export function SecurityPanel({
  profile,
  onChangePassword,
  onSavePreferences,
}: {
  profile: Profile;
  onChangePassword: (input: ChangePasswordInput) => Promise<void>;
  onSavePreferences: (patch: PreferencesPatch) => Promise<void>;
}) {
  return (
    <Panel title="Configurações de Segurança">
      <SubHeading>Alterar senha</SubHeading>
      <PasswordForm onSubmit={onChangePassword} />

      <SubHeading>Acesso por IP</SubHeading>
      <IpRestriction profile={profile} onSave={onSavePreferences} />

      <SubHeading>Autenticação de dois fatores</SubHeading>
      <Switch
        label="Autenticação de Dois Fatores (2FA)"
        description="Requer um código gerado por um app autenticador além da senha."
        checked={false}
        onChange={() => undefined}
        disabled
        badge="Em breve"
      />

      <SubHeading>Sessões ativas</SubHeading>
      <p className="m-0 rounded-lg border border-border bg-background p-4 text-[13px] leading-normal text-muted-foreground">
        O gerenciamento de sessões e dispositivos estará disponível em breve.
      </p>
    </Panel>
  );
}
