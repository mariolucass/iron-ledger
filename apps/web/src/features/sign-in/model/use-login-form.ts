"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginFormValues } from "./login-schema";
import { useLoginFormSubmit } from "./use-login-form-submit";

const defaultValues: LoginFormValues = { email: "", password: "", remember: true };

export function useLoginForm() {
  const emailRef = useRef<HTMLInputElement | null>(null);
  const form = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), defaultValues, mode: "onSubmit" });
  const submit = useLoginFormSubmit();

  useEffect(() => { emailRef.current?.focus({ preventScroll: true }); }, []);

  const onSubmit = form.handleSubmit(submit.submitLogin);
  const onCancel = () => form.reset();
  const onClear = () => {
    form.reset({ ...defaultValues, remember: false });
    emailRef.current?.focus();
  };

  return {
    form,
    emailRef,
    onSubmit,
    isEditing: form.formState.isDirty,
    isSubmitting: form.formState.isSubmitting,
    onCancel,
    onClear,
    ...submit,
  };
}
