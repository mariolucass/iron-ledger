"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { userApi } from "@/entities/user";
import { ApiError } from "@/shared/api/client";
import { registerSchema, type RegisterFormValues } from "./register-schema";

const defaultValues: RegisterFormValues = { name: "", email: "", password: "", confirmPassword: "" };

export function useRegisterForm() {
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState("");
  const form = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema), defaultValues, mode: "onSubmit" });

  useEffect(() => { nameRef.current?.focus({ preventScroll: true }); }, []);

  const onSubmit = form.handleSubmit(async ({ name, email, password }) => {
    setError("");
    try {
      await userApi.register({ name, email, password });
      router.replace("/dashboard");
      router.refresh();
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === "EMAIL_ALREADY_REGISTERED") {
        form.setError("email", { message: reason.message });
        return;
      }
      setError(reason instanceof ApiError ? reason.message : "Não foi possível alcançar o serviço de cadastro. Tente novamente.");
    }
  });

  return { form, nameRef, onSubmit, error, isSubmitting: form.formState.isSubmitting };
}
