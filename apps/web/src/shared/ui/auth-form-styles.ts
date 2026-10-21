/** Estilos compartilhados pelos formulários de login e cadastro. */

export const authInputClass =
  "h-12 w-full rounded-2xl border border-white/10 bg-white/[0.05] pr-11 pl-11 text-[15px] tracking-[-0.01em] text-foreground caret-primary outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-white/40 hover:border-white/20 focus:border-primary/70 focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_rgba(0,229,160,0.12)] disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none";

export const authInputErrorClass = "!border-destructive/70 shadow-[0_0_0_4px_rgba(255,105,97,0.1)]";

export const authLabelClass = "text-[13px] font-medium tracking-[-0.005em] text-white/75";

export const authIconClass =
  "pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-white/45 transition-colors duration-150 group-focus-within:text-primary motion-reduce:transition-none";

export const authErrorTextClass = "m-0 text-[13px] leading-snug text-destructive";

/** Botão principal: pílula branca, igual ao CTA da landing page. */
export const authSubmitClass =
  "flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-white text-[15px] font-semibold tracking-[-0.015em] text-[#0a0b0d] shadow-[0_0_0_1px_rgba(255,255,255,0.5),0_12px_36px_rgba(255,255,255,0.16)] outline-none transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.6),0_16px_46px_rgba(255,255,255,0.26)] focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1012] active:translate-y-0 active:scale-[0.985] disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none motion-reduce:hover:translate-y-0";

export const authGlassButtonClass =
  "relative flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] text-[14px] font-medium text-white/60 disabled:cursor-not-allowed";
