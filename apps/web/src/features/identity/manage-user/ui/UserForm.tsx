"use client";

import { Check, Save } from "lucide-react";
import { USER_STATUSES, userStatusLabel, type RoleSummary, type UserDetail } from "@/entities/user";
import {
  Form,
  FormControl,
  FormField,
  FormFieldRow,
  FormItem,
  FormMessage,
} from "@/shared/ui/kit/form";
import { cn } from "@/shared/ui/kit/utils";
import { inputClass } from "@/shared/ui/form-primitives";
import { SelectInput } from "@/shared/ui/kit/select";
import { FormActions, FormSection } from "@/shared/ui/form-page";
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
  const { isSubmitting, isDirty } = form.formState;

  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-9">
        <FormSection title="Dados do usuário">
          <FormFieldRow control={form.control} name="name" label="Nome completo">
            {(field) => <input {...field} className={inputClass} autoComplete="off" />}
          </FormFieldRow>
          <FormFieldRow
            control={form.control}
            name="email"
            label="E-mail"
            description={isEditing ? "O e-mail não pode ser alterado." : undefined}
          >
            {(field) => (
              <input
                {...field}
                className={inputClass}
                type="email"
                readOnly={isEditing}
                disabled={isEditing}
                autoComplete="off"
                spellCheck={false}
              />
            )}
          </FormFieldRow>
          {isEditing ? (
            <FormFieldRow
              control={form.control}
              name="status"
              label="Situação"
              description="Usuários inativos ou suspensos não conseguem entrar."
            >
              {(field) => (
                <SelectInput
                  {...field}
                  options={USER_STATUSES.map((value) => ({
                    value: value,
                    label: userStatusLabel[value],
                  }))}
                />
              )}
            </FormFieldRow>
          ) : (
            <FormFieldRow
              control={form.control}
              name="password"
              label="Senha inicial"
              description="A pessoa pode trocá-la depois em Configurações > Segurança."
            >
              {(field) => (
                <input
                  {...field}
                  className={inputClass}
                  type="password"
                  autoComplete="new-password"
                />
              )}
            </FormFieldRow>
          )}
        </FormSection>

        <FormField
          control={form.control}
          name="roles"
          render={({ field }) => (
            <FormItem className="gap-3">
              <FormSection
                title="Papéis"
                description="Sem nenhum papel, o usuário só consulta informações."
                flush
              >
                <FormControl>
                  <div
                    role="group"
                    aria-label="Papéis do usuário"
                    className="divide-y divide-border"
                  >
                    {roles.map((role) => {
                      const checked = field.value.includes(role.name);
                      return (
                        <label
                          key={role.id}
                          className="flex cursor-pointer items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-card-hover has-[:focus-visible]:bg-card-hover motion-reduce:transition-none md:px-6"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block font-mono text-[13.5px] font-medium text-foreground">
                              {role.name}
                            </span>
                            <span className="mt-0.5 block text-[13px] leading-snug font-normal text-muted-foreground">
                              {role.description ?? "Sem descrição."}
                            </span>
                          </span>
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={checked}
                            onChange={(event) =>
                              field.onChange(
                                event.target.checked
                                  ? [...field.value, role.name]
                                  : field.value.filter((name) => name !== role.name),
                              )
                            }
                          />
                          <span
                            aria-hidden
                            className={cn(
                              "grid size-[22px] shrink-0 place-items-center rounded-full border transition-colors duration-150 peer-focus-visible:ring-[3px] peer-focus-visible:ring-primary/30 motion-reduce:transition-none",
                              checked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border-strong",
                            )}
                          >
                            {checked && <Check size={13} strokeWidth={3} />}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </FormControl>
              </FormSection>
              <FormMessage className="px-1" />
            </FormItem>
          )}
        />

        <FormActions
          status={status}
          onCancel={onCancel}
          cancelLabel={isEditing ? "Voltar" : "Cancelar"}
          submitting={isSubmitting}
          disabled={isEditing && !isDirty}
          dirty={isEditing ? isDirty : undefined}
          icon={<Save />}
          submitLabel={isEditing ? "Guardar alterações" : "Criar usuário"}
        />
      </form>
    </Form>
  );
}
