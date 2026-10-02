"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LoginFormValues } from "./login-schema";

export function useLoginFormSubmit() {
  const router = useRouter();
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const submitLogin = async (values: LoginFormValues) => {
    setNotice("");
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setError(body?.message ?? "Não foi possível entrar. Verifique seus dados e tente novamente.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Não foi possível alcançar o serviço de autenticação. Tente novamente.");
    }
  };

  const handleForgotPassword = (email: string, isEmailValid: boolean) => {
    setError("");
    setNotice(isEmailValid
      ? `Enviaremos instruções para ${email} quando a recuperação estiver conectada.`
      : "Informe um email válido primeiro para iniciar a recuperação de acesso.");
  };

  const handleEnterpriseAccess = (method: "SSO" | "passkey") => {
    setError("");
    setNotice(method === "SSO"
      ? "O login corporativo estará disponível quando o provedor de identidade for conectado."
      : "O acesso por passkey estará disponível quando a autenticação for conectada.");
  };

  return { notice, error, submitLogin, handleForgotPassword, handleEnterpriseAccess };
}
