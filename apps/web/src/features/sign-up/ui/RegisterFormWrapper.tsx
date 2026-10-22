"use client";

import dynamic from "next/dynamic";

const RegisterFormClient = dynamic(() => import("./RegisterFormClient"), {
  loading: () => (
    <div
      className="grid gap-5 motion-safe:animate-pulse"
      role="status"
      aria-label="Carregando formulário"
    >
      <div className="h-8 w-44 rounded-lg bg-white/[0.06]" />
      <div className="h-4 w-60 rounded-md bg-white/[0.06]" />
      <div className="mt-3 h-12 rounded-2xl bg-white/[0.06]" />
      <div className="h-12 rounded-2xl bg-white/[0.06]" />
      <div className="h-12 rounded-2xl bg-white/[0.06]" />
      <div className="h-12 rounded-full bg-white/[0.08]" />
    </div>
  ),
  ssr: false,
});

export function RegisterFormWrapper() {
  return <RegisterFormClient />;
}
