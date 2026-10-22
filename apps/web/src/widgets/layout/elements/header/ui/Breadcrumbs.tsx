"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, House } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { nonLinkSegments, pathLabels } from "@/shared/config/app-navigation";

interface Crumb {
  href: Route;
  label: string;
  /** Segmento sem página própria (ex.: pasta de rotas): aparece como texto, nunca como link. */
  linkable: boolean;
}

const HOME: Route = "/dashboard";

const OPAQUE_ID = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{16,}|\d+)$/i;

/** "meu-ponto_x" -> "Meu ponto x"; ids opacos (UUID, número) viram "Detalhes". */
function labelFor(segment: string): string {
  const known = pathLabels[segment];
  if (known) return known;

  let text = segment;
  try {
    text = decodeURIComponent(segment);
  } catch {
    // segmento malformado: usa o texto cru
  }
  if (OPAQUE_ID.test(text)) return "Detalhes";
  const spaced = text.replace(/[-_]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function buildTrail(pathname: string): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((part, index) => ({
    href: `/${parts.slice(0, index + 1).join("/")}` as Route,
    label: labelFor(part),
    linkable: index === parts.length - 1 || !nonLinkSegments.has(part),
  }));
}

const pill =
  "inline-flex h-8 items-center rounded-full px-2.5 text-[14px] tracking-[-0.02em] whitespace-nowrap outline-none transition-[background-color,color,transform] duration-150 focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100";

const interactive = `${pill} font-medium text-muted-foreground hover:bg-ink/[0.07] hover:text-foreground`;

export function Breadcrumbs({ fallbackTitle }: { fallbackTitle: string }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const trail = buildTrail(pathname);

  if (!trail.length) {
    return (
      <span className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">
        {fallbackTitle || "Iron Ledger"}
      </span>
    );
  }

  const current = trail[trail.length - 1]!;
  const parent = trail.length > 1 ? trail[trail.length - 2]! : undefined;
  // Voltar para o "Início" é redundante quando a própria página é o Dashboard.
  const showHome = trail[0]!.href !== HOME;

  return (
    <nav aria-label="Navegação estrutural" className="min-w-0">
      {/* Celular: estilo "voltar" do iOS — ‹ Nível anterior · Página atual */}
      <div className="flex min-w-0 items-center gap-1 sm:hidden">
        {parent && (
          <Link
            href={parent.linkable ? parent.href : HOME}
            aria-label={`Voltar para ${parent.label}`}
            className={`${interactive} -ml-1.5 shrink-0 gap-0.5 pr-2.5 pl-1.5 text-primary hover:text-primary`}
          >
            <ChevronLeft size={18} strokeWidth={2.25} aria-hidden />
            <span className="max-w-[28vw] truncate">{parent.label}</span>
          </Link>
        )}
        <span
          aria-current="page"
          className="min-w-0 truncate px-1.5 text-[15px] font-semibold tracking-[-0.02em] text-foreground"
        >
          {current.label}
        </span>
      </div>

      {/* Tablet e desktop: trilha completa */}
      <motion.ol
        key={pathname}
        initial={reducedMotion ? false : { opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="m-0 hidden min-w-0 list-none items-center gap-0.5 p-0 sm:flex"
      >
        {showHome && (
          <li className="flex shrink-0 items-center gap-0.5">
            <Link href={HOME} aria-label="Início" className={`${interactive} w-8 justify-center px-0`}>
              <House size={15} strokeWidth={1.9} aria-hidden />
            </Link>
            <Separator />
          </li>
        )}

        {trail.map((crumb, index) => {
          const last = index === trail.length - 1;
          return (
            <li key={crumb.href} className={`flex items-center gap-0.5 ${last ? "min-w-0" : "shrink-0"}`}>
              {last ? (
                <span
                  aria-current="page"
                  title={crumb.label}
                  className={`${pill} min-w-0 max-w-[42vw] bg-ink/[0.05] px-3 text-[15px] font-semibold text-foreground`}
                >
                  <span className="truncate">{crumb.label}</span>
                </span>
              ) : (
                <>
                  {crumb.linkable ? (
                    <Link href={crumb.href} className={interactive}>
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={`${pill} font-medium text-muted-foreground`}>{crumb.label}</span>
                  )}
                  <Separator />
                </>
              )}
            </li>
          );
        })}
      </motion.ol>
    </nav>
  );
}

function Separator() {
  return <ChevronRight size={13} strokeWidth={2.25} aria-hidden className="shrink-0 text-ink/25" />;
}
