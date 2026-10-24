"use client";

import { ChevronLeft, ChevronRight, House } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { navigationRecordMatches, navigationRoute } from "@/shared/config/app-navigation";
import type { NavigationRecordMatch } from "@/shared/config/app-navigation-types";
import { useRecordNames } from "../../../model/record-names";

interface Crumb {
  href: Route;
  label: string;
  /** Segmento sem página própria (ex.: pasta de rotas): aparece como texto, nunca como link. */
  linkable: boolean;
}

const HOME: Route = "/dashboard";

const OPAQUE_ID =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{16,}|\d+)$/i;

/** Rota não declarada: "meu-ponto_x" -> "Meu ponto x"; ids opacos (UUID, número) viram "Detalhes". */
function labelFor(segment: string): string {
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

/** Registros aparecem pelo nome; na rota do próprio registro, a página atual vem depois dele (ex.: "Visão geral"). */
function buildTrail(pathname: string, nameOf: (record: NavigationRecordMatch) => string | null | undefined): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  const records = navigationRecordMatches(pathname);
  const trail = parts.map((part, index) => {
    const href = `/${parts.slice(0, index + 1).join("/")}` as Route;
    const route = navigationRoute(href);
    const record = records.find(({ path }) => path === href);
    return {
      href,
      label: (record && nameOf(record)) || (route?.label ?? labelFor(part)),
      linkable: href !== pathname && route?.page !== false,
    };
  });
  const current = records.at(-1);
  const overview = current?.pages.find(({ suffix }) => !suffix);
  if (current?.path === pathname && overview && nameOf(current) !== null) {
    trail.push({ href: pathname as Route, label: overview.label, linkable: false });
  }
  return trail;
}

const pill =
  "inline-flex h-8 items-center rounded-full px-2.5 text-[14px] tracking-[-0.02em] whitespace-nowrap outline-none transition-[background-color,color,transform] duration-150 focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100";

const interactive = `${pill} font-medium text-muted-foreground hover:bg-ink/[0.07] hover:text-foreground`;

export function Breadcrumbs({ fallbackTitle }: { fallbackTitle: string }) {
  const pathname = usePathname();
  const nameOf = useRecordNames();
  const trail = buildTrail(pathname, nameOf);

  if (!trail.length) {
    return (
      <span className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">
        {fallbackTitle || "Iron Ledger"}
      </span>
    );
  }

  const current = trail[trail.length - 1]!;
  const parent = trail.length > 1 ? trail[trail.length - 2]! : undefined;
  const mobileBack = parent?.href === current.href ? trail[trail.length - 3] : parent;
  // Voltar para o "Início" é redundante quando a própria página é o Dashboard.
  const showHome = trail[0]!.href !== HOME;

  return (
    <nav aria-label="Navegação estrutural" className="min-w-0">
      {/* Celular: estilo "voltar" do iOS — ‹ Nível anterior · Página atual */}
      <div className="flex min-w-0 items-center gap-1 sm:hidden">
        {mobileBack && (
          <Link
            href={mobileBack.linkable ? mobileBack.href : HOME}
            aria-label={`Voltar para ${mobileBack.label}`}
            className={`${interactive} -ml-1.5 shrink-0 gap-0.5 pr-2.5 pl-1.5 text-primary hover:text-primary`}
          >
            <ChevronLeft size={18} strokeWidth={2.25} aria-hidden />
            <span className="max-w-[28vw] truncate">{mobileBack.label}</span>
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
      <ol className="m-0 hidden min-w-0 list-none items-center gap-0.5 p-0 sm:flex">
        {showHome && (
          <li className="flex shrink-0 items-center gap-0.5">
            <Link
              href={HOME}
              aria-label="Início"
              className={`${interactive} w-8 justify-center px-0`}
            >
              <House size={15} strokeWidth={1.9} aria-hidden />
            </Link>
            <Separator />
          </li>
        )}

        {trail.map((crumb, index) => {
          const last = index === trail.length - 1;
          return (
            <li
              key={`${crumb.href}:${index}`}
              className={`flex items-center gap-0.5 ${last ? "min-w-0" : "shrink-0"}`}
            >
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
                    <Link
                      href={crumb.href}
                      title={crumb.label}
                      className={`${interactive} max-w-[220px] truncate`}
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      title={crumb.label}
                      className={`${pill} max-w-[220px] truncate font-medium text-muted-foreground`}
                    >
                      {crumb.label}
                    </span>
                  )}
                  <Separator />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Separator() {
  return <ChevronRight size={13} strokeWidth={2.25} aria-hidden className="shrink-0 text-ink/25" />;
}
