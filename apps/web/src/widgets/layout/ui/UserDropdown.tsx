"use client";

import { motion } from "framer-motion";
import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { useSignOut } from "@/features/sign-out";
import { ease2 } from "@/shared/lib/animation";
import { useEscape } from "@/shared/lib/use-escape";
import { useOutsideClick } from "@/shared/lib/use-outside-click";
import { roleLabelOf, useCurrentUser } from "../model/current-user";
import { focusRing, glassPanel } from "./glass";
import { UserAvatar } from "./UserAvatar";

const accountLinks = [
  { icon: User, label: "Perfil", href: "/settings" as const },
  { icon: Settings, label: "Configurações", href: "/settings" as const },
];

const itemClass = `flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-medium tracking-[-0.01em] text-white/75 transition-colors duration-150 motion-reduce:transition-none ${focusRing}`;

export function UserDropdown({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { profile } = useCurrentUser();
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
      className={`absolute top-[calc(100%+10px)] right-0 z-[200] w-[264px] overflow-hidden rounded-3xl ${glassPanel}`}
    >
      <div className="border-b border-white/[0.08] px-4 py-4">
        <div className="flex items-center gap-3">
          <UserAvatar className="size-10 text-[13px]" />
          <span className="min-w-0">
            <strong className="block truncate text-[14px] font-semibold tracking-[-0.015em]">
              {profile?.name ?? "Conta"}
            </strong>
            <small className="block truncate text-[12.5px] text-white/60">
              {profile?.email ?? "Carregando…"}
            </small>
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="rounded-full border border-primary/30 bg-primary-soft px-2.5 py-0.5 text-[11.5px] font-semibold text-primary">
            {roleLabelOf(profile?.roles)}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11.5px] text-white/55">
            v2.4.0
          </span>
        </div>
      </div>
      <div className="p-2">
        {accountLinks.map(({ icon: Icon, label, href }) => (
          <Link key={label} href={href} role="menuitem" onClick={onClose} className={`${itemClass} hover:bg-white/[0.07] hover:text-foreground`}>
            <Icon size={16} strokeWidth={1.8} aria-hidden />
            {label}
          </Link>
        ))}
      </div>
      <div className="border-t border-white/[0.08] p-2">
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
