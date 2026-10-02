"use client";

import { motion } from "framer-motion";
import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ease2 } from "@/shared/lib/animation";
import { useOutsideClick } from "@/shared/lib/use-outside-click";
import { UserAvatar } from "./UserAvatar";

const accountLinks = [
  { icon: User, label: "Perfil", href: "/settings" as const },
  { icon: Settings, label: "Configurações", href: "/settings" as const },
];

export function UserDropdown({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  useOutsideClick(ref, onClose);

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      onClose();
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.18, ease: ease2 }}
      className="absolute top-[calc(100%+10px)] right-0 z-[200] w-60 overflow-hidden rounded-[14px] border border-border-strong bg-popover shadow-elevated"
    >
      <div className="border-b border-border px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <UserAvatar className="size-[34px] text-[11.5px]" />
          <span>
            <strong className="block text-[12.5px] font-bold tracking-[-0.015em]">
              Admin
            </strong>
            <small className="text-[11px] text-muted-foreground">
              admin@ironledger
            </small>
          </span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5">
          <span className="rounded border border-primary/30 bg-primary-soft px-2 py-0.5 text-[9.5px] font-bold tracking-[0.05em] text-primary uppercase">
            Super Admin
          </span>
          <span className="rounded border border-border bg-card px-2 py-0.5 text-[9.5px] text-subtle-foreground">
            v2.4.0
          </span>
        </div>
      </div>
      <div className="p-1.5">
        {accountLinks.map(({ icon: Icon, label, href }) => (
          <Link
            key={label}
            href={href}
            onClick={onClose}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium tracking-[-0.01em] text-muted-foreground transition hover:bg-card-hover hover:text-foreground"
          >
            <Icon size={14} strokeWidth={1.8} />
            {label}
          </Link>
        ))}
      </div>
      <div className="border-t border-border p-1.5">
        <button
          type="button"
          onClick={logout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium tracking-[-0.01em] text-muted-foreground transition hover:bg-destructive-soft hover:text-destructive disabled:cursor-wait disabled:opacity-60"
        >
          <LogOut size={14} strokeWidth={1.8} />
          {isLoggingOut ? "Encerrando..." : "Sair da conta"}
        </button>
      </div>
    </motion.div>
  );
}
