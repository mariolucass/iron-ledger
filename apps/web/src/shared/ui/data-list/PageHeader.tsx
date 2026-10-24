import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  /** Texto de apoio abaixo do título; aceita marcação (ex.: <strong>). */
  description?: ReactNode;
  /** Linha pequena acima do título, em verde (ex.: "Monitoramento em tempo real"). */
  eyebrow?: string;
  /** Link para a página de origem; usado em detalhes e formulários. */
  back?: { href: Route; label: string };
  /** Selos ao lado do título (ex.: situação do registro). */
  badges?: ReactNode;
  /** Linha logo abaixo do título (ex.: SKU, e-mail, datas). */
  meta?: ReactNode;
  /** Ações à direita (botões). */
  actions?: ReactNode;
}

/** Cabeçalho padrão das páginas: título em gradiente, apoio, selos e ações. */
export function PageHeader({ title, description, eyebrow, back, badges, meta, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="mb-3 inline-flex items-center gap-1.5 rounded-full text-[13.5px] text-ink/60 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60 motion-reduce:transition-none"
          >
            <ArrowLeft size={14} aria-hidden /> {back.label}
          </Link>
        )}
        {eyebrow && <p className="m-0 mb-2 text-[13px] font-medium tracking-[-0.005em] text-primary">{eyebrow}</p>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="m-0 bg-gradient-to-b from-ink to-ink/70 bg-clip-text pb-[0.12em] text-[clamp(1.625rem,3vw,2rem)] leading-[1.25] font-semibold tracking-[-0.04em] text-transparent">
            {title}
          </h1>
          {badges}
        </div>
        {meta && <div className="mt-2 text-[13.5px] text-ink/55">{meta}</div>}
        {description && <div className="mt-2 max-w-3xl text-[15px] leading-relaxed tracking-[-0.01em] text-ink/60">{description}</div>}
      </div>
      {actions && <div className="flex w-full flex-wrap items-center gap-2 max-sm:[&>*:last-child:not(:first-child)]:flex-1 sm:w-auto">{actions}</div>}
    </div>
  );
}

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Ação principal da página (ex.: "Novo produto"); use em `<Link>` ou `<button>`. */
export const primaryActionClass = `inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-[14.5px] font-semibold tracking-[-0.01em] text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_28px_rgba(0,229,160,0.22)] transition-[background-color,transform,box-shadow] duration-150 hover:bg-primary-hover hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_10px_34px_rgba(0,229,160,0.32)] active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 ${focusRing}`;

/** Ação secundária: pílula de vidro. */
export const secondaryActionClass = `inline-flex h-11 items-center justify-center gap-2 rounded-full border border-ink/10 bg-ink/[0.05] px-4 text-[14.5px] font-medium tracking-[-0.01em] text-ink/80 backdrop-blur-xl transition-[background-color,border-color,color] duration-150 hover:border-ink/20 hover:bg-ink/[0.1] hover:text-foreground disabled:opacity-50 motion-reduce:transition-none ${focusRing}`;
