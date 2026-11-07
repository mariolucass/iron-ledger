"use client";

import {
  authErrorTextClass,
  authIconClass,
  authInputClass,
  authInputErrorClass,
  authLabelClass,
  authGlassButtonClass,
  authSubmitClass,
} from "@/shared/ui/auth-form-styles";
import { loginSchema } from "../model/login-schema";
import { useLoginForm } from "../model/use-login-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/kit/form";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, CheckCircle2, Eye, EyeOff, Fingerprint, KeyRound, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LoginFormClient() {
  const [showPassword, setShowPassword] = useState(false);
  const { form, emailRef, onSubmit, isSubmitting, notice, error, handleForgotPassword } = useLoginForm();

  const forgotPassword = () => {
    const email = form.getValues("email").trim();
    const isEmailValid = loginSchema.shape.email.safeParse(email).success;
    handleForgotPassword(email, isEmailValid);
    if (!isEmailValid) emailRef.current?.focus();
  };

  return (
    <>
      <header className="mb-8">
        <h1 id="login-title" className="m-0 mb-2 text-[clamp(1.875rem,4vw,2.25rem)] leading-[1.08] font-semibold tracking-[-0.045em] text-foreground">
          Entrar
        </h1>
        <p className="m-0 text-[15.5px] leading-relaxed tracking-[-0.01em] text-ink/65">Acesse o seu workspace do Iron Ledger.</p>
      </header>

      <div className="grid grid-cols-2 gap-2.5 max-[420px]:grid-cols-1">
        <button type="button" disabled className={authGlassButtonClass} title="Disponível em breve">
          <ShieldCheck size={16} aria-hidden /> SSO
          <span className="rounded-full border border-ink/10 bg-ink/[0.05] px-2 py-px text-[11px] text-ink/50">Em breve</span>
        </button>
        <button type="button" disabled className={authGlassButtonClass} title="Disponível em breve">
          <Fingerprint size={16} aria-hidden /> Passkey
          <span className="rounded-full border border-ink/10 bg-ink/[0.05] px-2 py-px text-[11px] text-ink/50">Em breve</span>
        </button>
      </div>

      <div className="my-6 flex items-center gap-4 text-[13px] text-ink/45 before:h-px before:flex-1 before:bg-ink/10 after:h-px after:flex-1 after:bg-ink/10">
        ou com e-mail
      </div>

      <Form {...form}>
        <form className="grid gap-5" onSubmit={onSubmit} noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem className="grid gap-2">
                <FormLabel className={authLabelClass}>E-mail corporativo</FormLabel>
                <div className="group relative">
                  <Mail className={authIconClass} size={17} aria-hidden="true" />
                  <FormControl>
                    <input
                      {...field}
                      ref={(element) => {
                        field.ref(element);
                        emailRef.current = element;
                      }}
                      className={`${authInputClass} ${fieldState.error ? authInputErrorClass : ""}`}
                      type="email"
                      inputMode="email"
                      autoComplete="username"
                      spellCheck={false}
                      placeholder="voce@empresa.com"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </div>
                <FormMessage className={authErrorTextClass} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <FormLabel className={authLabelClass}>Senha</FormLabel>
                  <button
                    type="button"
                    onClick={forgotPassword}
                    className="cursor-pointer rounded-md border-0 bg-transparent px-1 py-0.5 text-[13px] font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary/60"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="group relative">
                  <KeyRound className={authIconClass} size={17} aria-hidden="true" />
                  <FormControl>
                    <input
                      {...field}
                      className={`${authInputClass} ${fieldState.error ? authInputErrorClass : ""}`}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Digite sua senha"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    aria-pressed={showPassword}
                    className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-ink/50 outline-none transition-colors hover:bg-ink/[0.08] hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60 motion-reduce:transition-none"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <FormMessage className={authErrorTextClass} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem>
                <label className="inline-flex cursor-pointer items-center gap-2.5 text-[14px] text-ink/70 select-none">
                  <input
                    className="peer sr-only"
                    ref={field.ref}
                    name={field.name}
                    type="checkbox"
                    checked={field.value}
                    disabled={isSubmitting}
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                  />
                  <span className="grid size-5 place-items-center rounded-md border border-ink/25 bg-ink/[0.04] text-primary-foreground transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/60 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-panel motion-reduce:transition-none">
                    {field.value && <Check size={13} strokeWidth={3} aria-hidden />}
                  </span>
                  Manter conectado neste dispositivo
                </label>
              </FormItem>
            )}
          />

          <AnimatePresence initial={false}>
            {(notice || error) && (
              <motion.div
                role={error ? "alert" : "status"}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`flex items-start gap-2.5 overflow-hidden rounded-2xl border px-4 py-3 text-[13.5px] leading-normal ${error ? "border-destructive/35 bg-destructive-soft text-destructive" : "border-ink/10 bg-ink/[0.05] text-ink/75"}`}
              >
                {error ? <AlertTriangle className="mt-0.5 shrink-0" size={15} aria-hidden /> : <CheckCircle2 className="mt-0.5 shrink-0 text-primary" size={15} aria-hidden />}
                <span>{error || notice}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" disabled={isSubmitting} className={authSubmitClass}>
            {isSubmitting ? (
              <>
                <Loader2 size={17} className="animate-spin motion-reduce:animate-none" aria-hidden /> Verificando acesso...
              </>
            ) : (
              <>
                Entrar <ArrowRight size={17} aria-hidden />
              </>
            )}
          </button>
        </form>
      </Form>

      <p className="m-0 mt-7 text-center text-[14.5px] text-ink/65">
        Ainda não tem conta?{" "}
        <Link href="/register" className="rounded-md font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary/60">
          Criar conta
        </Link>
      </p>

      <p className="m-0 mt-6 flex items-start gap-2 border-t border-ink/[0.08] pt-5 text-[12.5px] leading-relaxed text-ink/50">
        <Lock size={13} className="mt-0.5 shrink-0" aria-hidden />
        Seus acessos podem ser registrados no histórico de auditoria da sua organização.
      </p>
    </>
  );
}
