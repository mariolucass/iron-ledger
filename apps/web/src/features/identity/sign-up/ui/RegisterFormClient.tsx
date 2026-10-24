"use client";

import {
  authErrorTextClass,
  authIconClass,
  authInputClass,
  authInputErrorClass,
  authLabelClass,
  authSubmitClass,
} from "@/shared/ui/auth-form-styles";
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
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ComponentType } from "react";
import type { FieldPath } from "react-hook-form";
import type { RegisterFormValues } from "../model/register-schema";
import { useRegisterForm } from "../model/use-register-form";

type FieldConfig = {
  name: FieldPath<RegisterFormValues>;
  label: string;
  placeholder: string;
  icon: ComponentType<{ className?: string; size?: number; "aria-hidden"?: boolean }>;
  type: "text" | "email" | "password";
  autoComplete: string;
};

const fields: FieldConfig[] = [
  {
    name: "name",
    label: "Nome completo",
    placeholder: "Maria Silva",
    icon: User,
    type: "text",
    autoComplete: "name",
  },
  {
    name: "email",
    label: "E-mail corporativo",
    placeholder: "voce@empresa.com",
    icon: Mail,
    type: "email",
    autoComplete: "email",
  },
  {
    name: "password",
    label: "Senha",
    placeholder: "Mínimo de 8 caracteres",
    icon: KeyRound,
    type: "password",
    autoComplete: "new-password",
  },
  {
    name: "confirmPassword",
    label: "Confirmar senha",
    placeholder: "Repita a senha",
    icon: KeyRound,
    type: "password",
    autoComplete: "new-password",
  },
];

export default function RegisterFormClient() {
  const [showPassword, setShowPassword] = useState(false);
  const { form, nameRef, onSubmit, error, isSubmitting } = useRegisterForm();

  return (
    <>
      <header className="mb-8">
        <h1
          id="register-title"
          className="m-0 mb-2 text-[clamp(1.875rem,4vw,2.25rem)] leading-[1.08] font-semibold tracking-[-0.045em] text-white"
        >
          Criar conta
        </h1>
        <p className="m-0 text-[15.5px] leading-relaxed tracking-[-0.01em] text-white/65">
          Cadastre-se para acessar o workspace do Iron Ledger.
        </p>
      </header>

      <Form {...form}>
        <form className="grid gap-5" onSubmit={onSubmit} noValidate>
          {fields.map(({ name, label, placeholder, icon: Icon, type, autoComplete }) => {
            const isPassword = type === "password";
            return (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field, fieldState }) => (
                  <FormItem className="grid gap-2">
                    <FormLabel className={authLabelClass}>{label}</FormLabel>
                    <div className="group relative">
                      <Icon className={authIconClass} size={17} aria-hidden />
                      <FormControl>
                        <input
                          {...field}
                          ref={(element) => {
                            field.ref(element);
                            if (name === "name") nameRef.current = element;
                          }}
                          className={`${authInputClass} ${fieldState.error ? authInputErrorClass : ""}`}
                          type={isPassword && showPassword ? "text" : type}
                          autoComplete={autoComplete}
                          spellCheck={false}
                          placeholder={placeholder}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      {name === "password" && (
                        <button
                          type="button"
                          onClick={() => setShowPassword((visible) => !visible)}
                          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                          aria-pressed={showPassword}
                          className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-white/50 outline-none transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:ring-2 focus-visible:ring-primary/60 motion-reduce:transition-none"
                        >
                          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      )}
                    </div>
                    <FormMessage className={authErrorTextClass} />
                  </FormItem>
                )}
              />
            );
          })}

          <AnimatePresence initial={false}>
            {error && (
              <motion.div
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2.5 overflow-hidden rounded-2xl border border-destructive/35 bg-destructive-soft px-4 py-3 text-[13.5px] leading-normal text-destructive"
              >
                <AlertTriangle className="mt-0.5 shrink-0" size={15} aria-hidden />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" disabled={isSubmitting} className={authSubmitClass}>
            {isSubmitting ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin motion-reduce:animate-none"
                  aria-hidden
                />{" "}
                Criando conta...
              </>
            ) : (
              <>
                Criar conta <ArrowRight size={17} aria-hidden />
              </>
            )}
          </button>
        </form>
      </Form>

      <p className="m-0 mt-7 text-center text-[14.5px] text-white/65">
        Já tem uma conta?{" "}
        <Link
          href="/login"
          className="rounded-md font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          Entrar
        </Link>
      </p>
    </>
  );
}
