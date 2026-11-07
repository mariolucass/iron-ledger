"use client";

import dynamic from "next/dynamic";

const LoginFormClient = dynamic(() => import("./LoginFormClient"), {
  loading: () => (
    <div
      className="grid gap-5 motion-safe:animate-pulse"
      role="status"
      aria-label="Carregando formulário"
    >
      <div className="h-8 w-40 rounded-lg bg-ink/[0.06]" />
      <div className="h-4 w-64 rounded-md bg-ink/[0.06]" />
      <div className="mt-3 h-12 rounded-2xl bg-ink/[0.06]" />
      <div className="h-12 rounded-2xl bg-ink/[0.06]" />
      <div className="h-12 rounded-full bg-ink/[0.08]" />
    </div>
  ),
  ssr: false,
});

export function LoginFormWrapper() {
  return <LoginFormClient />;
}
