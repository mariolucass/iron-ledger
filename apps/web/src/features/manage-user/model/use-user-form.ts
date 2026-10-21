"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { userApi, type UserDetail } from "@/entities/user";
import { ApiError } from "@/shared/api/client";
import { withSession } from "@/shared/auth/with-session";
import type { Status } from "@/shared/ui/form-primitives";
import {
  createUserFormSchema,
  editUserFormSchema,
  emptyUserForm,
  sameRoles,
  type UserFormValues,
} from "./user-schema";

const toValues = (user: UserDetail): UserFormValues => ({
  name: user.name,
  email: user.email,
  password: "",
  status: user.status,
  roles: user.roles.map((role) => role.name),
});

interface Options {
  user?: UserDetail;
  onSaved: (user: UserDetail, mode: "created" | "updated") => void;
}

export function useUserForm({ user, onSaved }: Options) {
  const [status, setStatus] = useState<Status>(null);
  const form = useForm<UserFormValues>({
    resolver: zodResolver(user ? editUserFormSchema : createUserFormSchema),
    defaultValues: user ? toValues(user) : emptyUserForm,
  });

  const submit = form.handleSubmit(async (values) => {
    setStatus(null);
    try {
      if (!user) {
        onSaved(
          await withSession(userApi.create({ name: values.name, email: values.email, password: values.password, roles: values.roles })),
          "created",
        );
        return;
      }

      // Dados e papéis são endpoints distintos: aplica só o que mudou.
      let saved = user;
      const current = toValues(user);
      if (values.name !== current.name || values.status !== current.status) {
        saved = await withSession(userApi.update(user.id, { name: values.name, status: values.status }));
      }
      if (!sameRoles(values.roles, current.roles)) {
        saved = await withSession(userApi.setRoles(user.id, values.roles));
      }
      form.reset(toValues(saved));
      onSaved(saved, "updated");
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === "EMAIL_ALREADY_REGISTERED") {
        form.setError("email", { message: reason.message });
        form.setFocus("email");
        return;
      }
      if (user) {
        // Pode ter havido gravação parcial: volta o formulário para o estado real do servidor.
        await withSession(userApi.get(user.id)).then((fresh) => form.reset(toValues(fresh))).catch(() => undefined);
      }
      setStatus({ type: "error", message: reason instanceof Error ? reason.message : "Não foi possível salvar o usuário." });
    }
  });

  return { form, submit, status, isEditing: Boolean(user) };
}
