"use client";

import { Save } from "lucide-react";
import { USER_STATUSES, userStatusLabel, type RoleSummary, type UserDetail } from "@/entities/user";
import { Button } from "@/shared/ui/kit/button";
import { Field, StatusMessage, inputClass } from "@/shared/ui/form-primitives";
import { useUserForm } from "../model/use-user-form";

export function UserForm({
  user,
  roles,
  onSaved,
  onCancel,
}: {
  user?: UserDetail;
  roles: RoleSummary[];
  onSaved: (user: UserDetail, mode: "created" | "updated") => void;
  onCancel: () => void;
}) {
  const { form, submit, status, isEditing } = useUserForm({ user, onSaved });
  const {
    register,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = form;
  const selected = watch("roles");

  const toggleRole = (name: string, checked: boolean) =>
    setValue("roles", checked ? [...selected, name] : selected.filter((role) => role !== name), { shouldDirty: true });

  return (
    <form onSubmit={submit} noValidate className="grid max-w-[960px] gap-6">
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="m-0 text-base font-bold text-foreground">Dados do usuário</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Nome completo" error={errors.name?.message}>
            {(props) => <input {...props} {...register("name")} className={inputClass} autoComplete="off" />}
          </Field>
          <Field label="E-mail" error={errors.email?.message} hint={isEditing ? "O e-mail não pode ser alterado." : undefined}>
            {(props) => (
              <input {...props} {...register("email")} className={inputClass} type="email" readOnly={isEditing} disabled={isEditing} autoComplete="off" spellCheck={false} />
            )}
          </Field>
          {isEditing ? (
            <Field label="Situação" error={errors.status?.message} hint="Usuários inativos ou suspensos não conseguem entrar.">
              {(props) => (
                <select {...props} {...register("status")} className={inputClass}>
                  {USER_STATUSES.map((value) => <option key={value} value={value}>{userStatusLabel[value]}</option>)}
                </select>
              )}
            </Field>
          ) : (
            <Field label="Senha inicial" error={errors.password?.message} hint="A pessoa pode trocá-la depois em Configurações > Segurança.">
              {(props) => <input {...props} {...register("password")} className={inputClass} type="password" autoComplete="new-password" />}
            </Field>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="m-0 text-base font-bold text-foreground">Papéis</h2>
        <p className="mt-1 mb-0 text-[13px] text-muted-foreground">Sem nenhum papel, o usuário só consulta informações.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {roles.map((role) => (
            <label
              key={role.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${selected.includes(role.name) ? "border-primary/50 bg-primary-soft" : "border-border bg-background hover:border-border-strong"}`}
            >
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-[var(--primary)]"
                checked={selected.includes(role.name)}
                onChange={(event) => toggleRole(role.name, event.target.checked)}
              />
              <span className="min-w-0">
                <span className="block font-mono text-sm font-semibold text-foreground">{role.name}</span>
                <span className="mt-0.5 block text-[13px] leading-normal text-muted-foreground">{role.description ?? "Sem descrição."}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <StatusMessage status={status} />

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" size="lg" onClick={onCancel} disabled={isSubmitting}>
          {isEditing ? "Voltar" : "Cancelar"}
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting || (isEditing && !isDirty)}>
          <Save /> {isSubmitting ? "Salvando…" : isEditing ? "Guardar alterações" : "Criar usuário"}
        </Button>
      </div>
    </form>
  );
}
