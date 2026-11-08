/** Estilos compartilhados pelos formulários de login e cadastro. */

export const authInputClass =
  "h-12 w-full rounded-2xl border border-ink/10 bg-ink/[0.05] pr-11 pl-11 text-[15px] tracking-[-0.01em] text-foreground caret-primary outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-ink/50 hover:border-ink/20 focus:border-primary/70 focus:bg-ink/[0.07] focus:shadow-[0_0_0_4px_var(--primary-glow)] disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none";

export const authInputErrorClass = "!border-destructive/70 shadow-[0_0_0_4px_var(--destructive-glow)]";

export const authLabelClass = "text-[13px] font-medium tracking-[-0.005em] text-ink/75";

export const authIconClass =
  "pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink/45 transition-colors duration-150 group-focus-within:text-primary motion-reduce:transition-none";

export const authErrorTextClass = "m-0 text-[13px] leading-snug text-destructive";

/** Botão principal: pílula de alto contraste, igual ao CTA da landing page. */
export const authSubmitClass =
  "flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-foreground text-[15px] font-semibold tracking-[-0.015em] text-background shadow-[0_0_0_1px_rgb(var(--ink-rgb)/0.5),0_12px_36px_rgb(var(--ink-rgb)/0.16)] outline-none transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgb(var(--ink-rgb)/0.6),0_16px_46px_rgb(var(--ink-rgb)/0.26)] focus-visible:ring-2 focus-visible:ring-ink/70 focus-visible:ring-offset-2 focus-visible:ring-offset-panel active:translate-y-0 active:scale-[0.985] disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none motion-reduce:hover:translate-y-0";

export const authGlassButtonClass =
  "relative flex h-11 w-full items-center justify-center gap-2 rounded-full border border-ink/10 bg-ink/[0.04] text-[14px] font-medium text-ink/60 disabled:cursor-not-allowed";
