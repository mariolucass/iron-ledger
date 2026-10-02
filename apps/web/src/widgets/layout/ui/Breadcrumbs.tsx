"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { pathLabels } from "../model/navigation";

export function Breadcrumbs({ fallbackTitle }: { fallbackTitle: string }) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);

  if (!parts.length)
    return (
      <span className="text-[13.5px] font-semibold text-foreground">
        {fallbackTitle || "Iron Ledger"}
      </span>
    );

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap"
    >
      {parts.map((part, index) => {
        const last = index === parts.length - 1;
        const path = `/${parts.slice(0, index + 1).join("/")}` as Route;
        return (
          <span key={path} className="flex min-w-0 items-center gap-1">
            {index > 0 && (
              <ChevronRight
                size={11}
                className="shrink-0 text-subtle-foreground"
              />
            )}
            {last ? (
              <span className="max-w-[42vw] truncate rounded px-1 py-0.5 text-[13.5px] font-semibold tracking-[-0.015em] text-foreground">
                {pathLabels[part] ?? part}
              </span>
            ) : (
              <Link
                href={path}
                className="rounded px-1 py-0.5 text-[13.5px] font-medium tracking-[-0.015em] text-subtle-foreground transition hover:bg-card-hover hover:text-muted-foreground"
              >
                {pathLabels[part] ?? part}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
