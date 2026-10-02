"use client";

import { spring4 } from "@/shared/lib/animation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/kit/form";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { loginSchema } from "../model/login-schema";
import { useLoginForm } from "../model/use-login-form";

const enterpriseButtonClass =
  "flex min-h-11 cursor-pointer items-center justify-center gap-[9px] rounded-[11px] border border-border bg-card text-xs font-semibold text-[#d9d9dc] transition-[border-color,background-color,transform] duration-160 hover:-translate-y-px hover:border-border-strong hover:bg-card-elevated";

const inputClass =
  "h-12 w-full rounded-xl border border-border bg-white/[0.035] pr-11 pl-[42px] text-[13px] tracking-[-0.01em] text-foreground caret-primary outline-none transition-[border-color,box-shadow,background-color] duration-160 placeholder:text-[#505055] hover:border-white/14 focus:border-primary/70 focus:bg-primary/[0.035] focus:shadow-[0_0_0_4px_rgba(0,229,160,0.09)] disabled:cursor-wait disabled:opacity-70";

export default function LoginFormClient() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    form,
    emailRef,
    onSubmit,
    isSubmitting,
    notice,
    error,
    handleForgotPassword,
    handleEnterpriseAccess,
  } = useLoginForm();

  const forgotPassword = () => {
    const email = form.getValues("email").trim();
    const isEmailValid = loginSchema.shape.email.safeParse(email).success;
    handleForgotPassword(email, isEmailValid);
    if (!isEmailValid) emailRef.current?.focus();
  };

  return (
    <>
      <header className="mb-[30px] max-[520px]:mb-[25px] [@media(max-height:760px)_and_(min-width:981px)]:mb-[22px]">
        <p className="mt-0 mb-2.5 text-[10px] font-bold tracking-[0.11em] text-primary uppercase">
          Acesso seguro
        </p>
        <h1
          className="mt-0 mb-2.5 text-[clamp(30px,3vw,38px)] leading-[1.08] font-bold tracking-[-0.05em]"
          id="login-title"
        >
          Bem-vindo de volta.
        </h1>
        <p className="m-0 text-[13.5px] leading-[1.6] text-muted-foreground">
          Entre no seu workspace para continuar sua operação.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2.5 max-[520px]:grid-cols-1">
        <motion.button
          type="button"
          className={enterpriseButtonClass}
          whileTap={{ scale: 0.98 }}
          transition={spring4}
          onClick={() => handleEnterpriseAccess("SSO")}
        >
          <ShieldCheck size={16} /> Continuar com SSO
        </motion.button>
        <motion.button
          type="button"
          className={enterpriseButtonClass}
          whileTap={{ scale: 0.98 }}
          transition={spring4}
          onClick={() => handleEnterpriseAccess("passkey")}
        >
          <Fingerprint size={16} /> Usar passkey
        </motion.button>
      </div>

      <div className="my-[22px] flex items-center gap-[13px] text-[9px] font-bold tracking-[0.1em] text-subtle-foreground uppercase before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border [@media(max-height:760px)_and_(min-width:981px)]:my-[17px]">
        ou entre com email
      </div>

      <Form {...form}>
        <form className="grid gap-[17px]" onSubmit={onSubmit} noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem className="grid gap-[7px]">
                <div className="flex items-center justify-between gap-3">
                  <FormLabel className="text-[11px] font-[650] tracking-[0.01em] text-[#c7c7cb]">
                    Email corporativo
                  </FormLabel>
                </div>
                <div className="group relative">
                  <Mail
                    className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle-foreground transition-colors duration-160 group-focus-within:text-primary"
                    size={16}
                    aria-hidden="true"
                  />
                  <FormControl>
                    <input
                      {...field}
                      ref={(element) => {
                        field.ref(element);
                        emailRef.current = element;
                      }}
                      className={`${inputClass} ${fieldState.error ? "border-[#ff6961]/65 shadow-[0_0_0_4px_rgba(255,105,97,0.07)]" : ""}`}
                      type="email"
                      inputMode="email"
                      autoComplete="username"
                      spellCheck={false}
                      placeholder="voce@empresa.com"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </div>
                <FormMessage className="m-0 text-[10.5px] leading-[1.4] text-destructive" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem className="grid gap-[7px]">
                <div className="flex items-center justify-between gap-3">
                  <FormLabel className="text-[11px] font-[650] tracking-[0.01em] text-[#c7c7cb]">
                    Senha
                  </FormLabel>
                  <button
                    className="cursor-pointer border-0 bg-transparent p-0.5 text-[10.5px] font-semibold text-primary"
                    type="button"
                    onClick={forgotPassword}
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="group relative">
                  <KeyRound
                    className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle-foreground transition-colors duration-160 group-focus-within:text-primary"
                    size={16}
                    aria-hidden="true"
                  />
                  <FormControl>
                    <input
                      {...field}
                      className={`${inputClass} ${fieldState.error ? "border-[#ff6961]/65 shadow-[0_0_0_4px_rgba(255,105,97,0.07)]" : ""}`}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Digite sua senha"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <button
                    className="absolute top-1/2 right-[9px] grid size-[34px] -translate-y-1/2 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-subtle-foreground hover:bg-white/[0.045] hover:text-muted-foreground"
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <FormMessage className="m-0 text-[10.5px] leading-[1.4] text-destructive" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between gap-4 max-[520px]:items-start">
                <label className="inline-flex cursor-pointer items-center gap-[9px] text-[11px] text-muted-foreground select-none">
                  <input
                    className="peer absolute opacity-0 pointer-events-none"
                    ref={field.ref}
                    name={field.name}
                    type="checkbox"
                    checked={field.value}
                    disabled={isSubmitting}
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                  />
                  <span className="grid size-[17px] place-items-center rounded-[5px] border border-border-strong bg-card text-primary transition-all duration-160 peer-checked:border-primary/65 peer-checked:bg-primary-soft">
                    {field.value && <Check size={11} strokeWidth={3} />}
                  </span>
                  Manter conectado neste dispositivo
                </label>
              </FormItem>
            )}
          />

          <AnimatePresence initial={false}>
            {(notice || error) && (
              <motion.div
                className={`flex items-start gap-[9px] rounded-[10px] border px-3 py-[11px] text-[10.5px] leading-[1.5] ${error ? "border-destructive/35 bg-destructive-soft text-destructive" : "border-border bg-card text-muted-foreground"}`}
                role={error ? "alert" : "status"}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {error ? <AlertTriangle className="shrink-0" size={14} /> : <CheckCircle2 className="shrink-0 text-primary" size={14} />}
                <span>{error || notice}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            className="relative mt-px flex min-h-12 w-full cursor-pointer items-center justify-center gap-[9px] overflow-hidden rounded-xl border-0 bg-[linear-gradient(135deg,#21efad,var(--primary))] text-[12.5px] font-[750] tracking-[-0.01em] text-[#042018] shadow-[0_10px_28px_rgba(0,229,160,0.16),inset_0_1px_0_rgba(255,255,255,0.45)] transition-[filter,box-shadow] duration-160 before:absolute before:inset-0 before:-translate-x-[110%] before:bg-[linear-gradient(105deg,transparent_35%,rgba(255,255,255,0.3)_50%,transparent_65%)] before:transition-transform before:duration-600 before:ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_14px_38px_rgba(0,229,160,0.23)] hover:brightness-[1.04] hover:before:translate-x-[110%] disabled:cursor-wait disabled:saturate-75 [&>*]:relative [&>*]:z-1"
            type="submit"
            disabled={isSubmitting}
            whileTap={isSubmitting ? undefined : { scale: 0.985 }}
            transition={spring4}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Verificando acesso...
              </>
            ) : (
              <>
                Entrar no Iron Ledger <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </form>
      </Form>

      <div className="mt-6 flex items-start gap-2.5 border-t border-border pt-5 text-[10px] leading-[1.55] text-subtle-foreground [@media(max-height:760px)_and_(min-width:981px)]:mt-[18px] [@media(max-height:760px)_and_(min-width:981px)]:pt-4">
        <LockKeyhole className="mt-px shrink-0 text-muted-foreground" size={15} />
        <span>
          <strong className="font-semibold text-muted-foreground">Sessão protegida.</strong>{" "}
          Este acesso pode ser registrado no módulo de auditoria para segurança e conformidade da sua organização.
        </span>
      </div>
    </>
  );
}
