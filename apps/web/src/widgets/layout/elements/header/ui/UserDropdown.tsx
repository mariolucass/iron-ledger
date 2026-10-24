"use client";

import { motion } from "framer-motion";
import { LogOut, Moon, Settings, Sun, User } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { useSignOut } from "@/features/identity/sign-out";
import { ease2 } from "@/shared/lib/animation";
import { useEscape } from "@/shared/lib/use-escape";
import { useOutsideClick } from "@/shared/lib/use-outside-click";
import { useTheme } from "@/shared/lib/use-theme";
import { roleLabelOf, useCurrentUser } from "@/entities/user";
import { focusRing, glassPanel } from "@/shared/ui/glass";
import { UserAvatar } from "@/entities/user";

const accountLinks = [
  { icon: User, label: "Perfil", href: "/settings" as const },
  { icon: Settings, label: "Configurações", href: "/settings" as const },
];

const itemClass = `flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-medium tracking-[-0.01em] text-ink/75 transition-colors duration-150 motion-reduce:transition-none ${focusRing}`;

export function UserDropdown({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { profile } = useCurrentUser();
  const { theme, toggleTheme } = useTheme();
  const { signOut: logout, isSigningOut: isLoggingOut } = useSignOut(onClose);
  useOutsideClick(ref, onClose);
  useEscape(onClose);

  return (
    <motion.div
      ref={ref}
      role="menu"
      aria-label="Menu do usuário"
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.18, ease: ease2 }}
      style={{ transformOrigin: "top right" }}
      className={`absolute top-[calc(100%+10px)] right-0 z-[200] w-[min(264px,calc(100vw-32px))] overflow-hidden rounded-3xl ${glassPanel}`}
    >
      <div className="border-b border-ink/[0.08] px-4 py-4">
        <div className="flex items-center gap-3">
          <UserAvatar className="size-10 text-[13px]" />
          <span className="min-w-0">
            <strong className="block truncate text-[14px] font-semibold tracking-[-0.015em]">
              {profile?.name ?? "Conta"}
            </strong>
            <small className="block truncate text-[12.5px] text-ink/60">
              {profile?.email ?? "Carregando…"}
            </small>
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="rounded-full border border-primary/30 bg-primary-soft px-2.5 py-0.5 text-[11.5px] font-semibold text-primary">
            {roleLabelOf(profile?.roles)}
          </span>
          <span className="rounded-full border border-ink/10 bg-ink/[0.04] px-2.5 py-0.5 text-[11.5px] text-ink/55">
            v2.4.0
          </span>
        </div>
      </div>
      <div className="p-2">
        {accountLinks.map(({ icon: Icon, label, href }) => (
          <Link
            key={label}
            href={href}
            role="menuitem"
            onClick={onClose}
            className={`${itemClass} hover:bg-ink/[0.07] hover:text-foreground`}
          >
            <Icon size={16} strokeWidth={1.8} aria-hidden />
            {label}
          </Link>
        ))}
        {/* No celular o botão de tema sai da barra para ela respirar. */}
        <button type="button" role="menuitem" onClick={toggleTheme} className={`${itemClass} hover:bg-ink/[0.07] hover:text-foreground sm:hidden`}>
          {theme === "light" ? <Moon size={16} strokeWidth={1.8} aria-hidden /> : <Sun size={16} strokeWidth={1.8} aria-hidden />}
          {theme === "light" ? "Modo escuro" : "Modo claro"}
        </button>
      </div>
      <div className="border-t border-ink/[0.08] p-2">
        <button
          type="button"
          role="menuitem"
          onClick={logout}
          disabled={isLoggingOut}
          className={`${itemClass} hover:bg-destructive-soft hover:text-destructive disabled:cursor-wait disabled:opacity-60`}
        >
          <LogOut size={16} strokeWidth={1.8} aria-hidden />
          {isLoggingOut ? "Encerrando..." : "Sair da conta"}
        </button>
      </div>
    </motion.div>
  );
}
