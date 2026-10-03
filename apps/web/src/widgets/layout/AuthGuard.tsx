"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  authenticatedFetch,
  clearSession,
  getAccessToken,
} from "@/shared/lib/api-client";

type GuardState = "checking" | "ready" | "unavailable";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<GuardState>("checking");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState("checking");

    if (!getAccessToken()) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
      return () => {
        active = false;
      };
    }

    authenticatedFetch("/auth/session")
      .then((response) => {
        if (response.status === 401) {
          clearSession();
          router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
          return;
        }
        if (!response.ok) throw new Error("Não foi possível validar a sessão.");
        if (active) setState("ready");
      })
      .catch(() => {
        if (active) setState("unavailable");
      });

    return () => {
      active = false;
    };
  }, [attempt, pathname, router]);

  if (state === "ready") return children;

  const isUnavailable = state === "unavailable";
  return (
    <main
      role="status"
      aria-live="polite"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#080808",
        color: "#F5F5F7",
        fontFamily: "var(--font-manrope), Arial, sans-serif",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 420 }}>
        <h1 style={{ margin: "0 0 10px", fontSize: 20 }}>
          {isUnavailable ? "Não foi possível validar sua sessão" : "Validando acesso…"}
        </h1>
        <p style={{ margin: "0 0 18px", color: "#A1A1AA", lineHeight: 1.6 }}>
          {isUnavailable
            ? "Confira se a API está em execução e tente novamente."
            : "Aguarde enquanto confirmamos suas credenciais."}
        </p>
        {isUnavailable && (
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              style={{
                border: 0,
                borderRadius: 8,
                padding: "10px 16px",
                background: "#00E5A0",
                color: "#07110D",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Tentar novamente
            </button>
            <button
              type="button"
              onClick={() => {
                clearSession();
                router.replace("/login");
              }}
              style={{
                border: "1px solid #3F3F46",
                borderRadius: 8,
                padding: "10px 16px",
                background: "transparent",
                color: "#F5F5F7",
                cursor: "pointer",
              }}
            >
              Ir para o login
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
