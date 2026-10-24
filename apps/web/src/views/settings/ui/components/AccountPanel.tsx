"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save, User } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Profile, UpdateProfileInput } from "@/entities/user";
import { Button } from "@/shared/ui/kit/button";
import { Form, FormFieldRow } from "@/shared/ui/kit/form";
import { Panel, StatusMessage, inputClass, type Status } from "@/shared/ui/form-primitives";
import { SelectInput } from "@/shared/ui/kit/select";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo.").max(120, "Nome muito longo."),
  avatarUrl: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^https?:\/\/\S+$/i.test(value),
      "Use uma URL http ou https válida.",
    ),
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
  const all =
    typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  return all.includes(current) ? all : [current, ...all];
}

function Avatar({ url }: { url: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = url && failedUrl !== url;
  return (
    <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-border bg-card-hover">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="size-full object-cover"
          src={url}
          alt=""
          onError={() => setFailedUrl(url)}
        />
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
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: initial });
  const {
    handleSubmit,
    reset,
    watch,
    control,
    formState: { isSubmitting, isDirty },
  } = form;

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
      setStatus({
        type: "error",
        message: reason instanceof Error ? reason.message : "Não foi possível salvar.",
      });
    }
  });

  const previewUrl = watch("avatarUrl").trim();

  return (
    <Panel title="Informações da Conta">
      <Form {...form}>
        <form onSubmit={submit} noValidate className="grid gap-5">
          <div className="flex items-center gap-5 border-b border-border pb-8">
            <Avatar url={/^https?:\/\/\S+$/i.test(previewUrl) ? previewUrl : null} />
            <div className="min-w-0">
              <div className="mb-1 truncate text-base font-semibold text-foreground">
                {profile.name}
              </div>
              <div className="text-[13px] text-muted-foreground">
                Informe a URL de uma imagem para usar como avatar.
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormFieldRow control={control} name="name" label="Nome completo">
              {(field) => <input {...field} className={inputClass} autoComplete="name" />}
            </FormFieldRow>
            <div className="grid gap-2">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Endereço de email
              </span>
              <input
                className={inputClass}
                value={profile.email}
                readOnly
                disabled
                aria-label="Endereço de email"
              />
              <span className="text-[13px] text-muted-foreground">
                O email não pode ser alterado.
              </span>
            </div>
          </div>

          <FormFieldRow control={control} name="avatarUrl" label="URL do avatar">
            {(field) => (
              <input
                {...field}
                className={inputClass}
                type="url"
                placeholder="https://…"
                spellCheck={false}
              />
            )}
          </FormFieldRow>

          <div className="grid gap-5 md:grid-cols-2">
            <FormFieldRow control={control} name="locale" label="Idioma">
              {(field) => (
                <SelectInput
                  {...field}
                  options={[
                    ...LOCALES,
                    ...(LOCALES.some((l) => l.value === profile.locale)
                      ? []
                      : [{ value: profile.locale, label: profile.locale }]),
                  ]}
                />
              )}
            </FormFieldRow>
            <FormFieldRow control={control} name="timezone" label="Fuso horário">
              {(field) => (
                <SelectInput
                  {...field}
                  options={zones.map((zone) => ({ value: zone, label: zone }))}
                />
              )}
            </FormFieldRow>
          </div>

          <div className="grid gap-2">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Papéis
            </span>
            <input
              className={inputClass}
              value={profile.roles.length ? profile.roles.join(", ") : "Nenhum papel atribuído"}
              readOnly
              disabled
              aria-label="Papéis"
            />
            <span className="text-[13px] text-muted-foreground">
              Os papéis são concedidos por um administrador.
            </span>
          </div>

          <StatusMessage status={status} />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              disabled={!isDirty || isSubmitting}
              onClick={() => {
                reset(initial);
                setStatus(null);
              }}
            >
              Descartar
            </Button>
            <Button type="submit" size="lg" disabled={!isDirty || isSubmitting}>
              <Save /> {isSubmitting ? "Salvando…" : "Guardar alterações"}
            </Button>
          </div>
        </form>
      </Form>
    </Panel>
  );
}
