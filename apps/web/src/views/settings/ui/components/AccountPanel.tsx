"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save, User } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Profile, UpdateProfileInput } from "@/entities/user";
import { Button } from "@/shared/ui/kit/button";
import { Field, Panel, StatusMessage, inputClass, type Status } from "@/shared/ui/form-primitives";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo.").max(120, "Nome muito longo."),
  avatarUrl: z
    .string()
    .trim()
    .refine((value) => value === "" || /^https?:\/\/\S+$/i.test(value), "Use uma URL http ou https válida."),
  locale: z.string().min(2),
  timezone: z.string().min(1),
});

type Values = z.infer<typeof schema>;

const LOCALES = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en-US", label: "English (US)" },
  { value: "es-ES", label: "Español" },
];

function timezones(current: string): string[] {
  const all = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  return all.includes(current) ? all : [current, ...all];
}

function Avatar({ url }: { url: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = url && failedUrl !== url;
  return (
    <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-border bg-card-hover">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="size-full object-cover" src={url} alt="" onError={() => setFailedUrl(url)} />
      ) : (
        <User size={32} className="text-muted-foreground" aria-hidden />
      )}
    </div>
  );
}

export function AccountPanel({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (input: UpdateProfileInput) => Promise<void>;
}) {
  const [status, setStatus] = useState<Status>(null);
  const zones = useMemo(() => timezones(profile.timezone), [profile.timezone]);
  const initial: Values = {
    name: profile.name,
    avatarUrl: profile.avatarUrl ?? "",
    locale: profile.locale,
    timezone: profile.timezone,
  };
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: initial });

  const submit = handleSubmit(async (values) => {
    setStatus(null);
    try {
      await onSave({
        name: values.name,
        avatarUrl: values.avatarUrl === "" ? null : values.avatarUrl,
        locale: values.locale,
        timezone: values.timezone,
      });
      reset(values);
      setStatus({ type: "success", message: "Alterações salvas." });
    } catch (reason) {
      setStatus({ type: "error", message: reason instanceof Error ? reason.message : "Não foi possível salvar." });
    }
  });

  const previewUrl = watch("avatarUrl").trim();

  return (
    <Panel title="Informações da Conta">
      <form onSubmit={submit} noValidate className="grid gap-5">
        <div className="flex items-center gap-5 border-b border-border pb-8">
          <Avatar url={/^https?:\/\/\S+$/i.test(previewUrl) ? previewUrl : null} />
          <div className="min-w-0">
            <div className="mb-1 truncate text-base font-semibold text-foreground">{profile.name}</div>
            <div className="text-[13px] text-muted-foreground">Informe a URL de uma imagem para usar como avatar.</div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Nome completo" error={errors.name?.message}>
            {(props) => <input {...props} {...register("name")} className={inputClass} autoComplete="name" />}
          </Field>
          <Field label="Endereço de email" hint="O email não pode ser alterado.">
            {(props) => <input {...props} className={inputClass} value={profile.email} readOnly disabled />}
          </Field>
        </div>

        <Field label="URL do avatar" error={errors.avatarUrl?.message}>
          {(props) => (
            <input {...props} {...register("avatarUrl")} className={inputClass} type="url" placeholder="https://…" spellCheck={false} />
          )}
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Idioma">
            {(props) => (
              <select {...props} {...register("locale")} className={inputClass}>
                {[...LOCALES, ...(LOCALES.some((l) => l.value === profile.locale) ? [] : [{ value: profile.locale, label: profile.locale }])].map(
                  (locale) => <option key={locale.value} value={locale.value}>{locale.label}</option>,
                )}
              </select>
            )}
          </Field>
          <Field label="Fuso horário">
            {(props) => (
              <select {...props} {...register("timezone")} className={inputClass}>
                {zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
              </select>
            )}
          </Field>
        </div>

        <Field label="Papéis" hint="Os papéis são concedidos por um administrador.">
          {(props) => (
            <input {...props} className={inputClass} value={profile.roles.length ? profile.roles.join(", ") : "Nenhum papel atribuído"} readOnly disabled />
          )}
        </Field>

        <StatusMessage status={status} />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" size="lg" disabled={!isDirty || isSubmitting} onClick={() => { reset(initial); setStatus(null); }}>
            Descartar
          </Button>
          <Button type="submit" size="lg" disabled={!isDirty || isSubmitting}>
            <Save /> {isSubmitting ? "Salvando…" : "Guardar alterações"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
