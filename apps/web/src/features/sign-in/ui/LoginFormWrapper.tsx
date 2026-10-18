"use client";

import dynamic from "next/dynamic";

const LoginFormClient = dynamic(() => import("./LoginFormClient"), {
  loading: () => (
    <div
      className="min-h-[430px] animate-pulse rounded-[14px] bg-white/[0.035]"
      aria-label="Carregando formulário"
    />
  ),
  ssr: false,
});

export function LoginFormWrapper() {
  return <LoginFormClient />;
}
