/**
 * Larguras de conteúdo, todas na grade de 8pt. O shell centraliza a coluna em telas
 * ultrawide; abaixo de `xl` as larguras antigas continuam valendo.
 */
export const pageWidth = {
  /** 720px; em telas largas vira 1200px, com as seções em duas colunas (ver `formGrid`). */
  form: "mx-auto max-w-[720px] xl:max-w-[1200px] 2xl:max-w-[1360px]",
  /** 960px; em telas largas vira 1280px para editores com tabelas ou painéis auxiliares. */
  wide: "mx-auto max-w-[960px] xl:max-w-[1280px] 2xl:max-w-[1440px]",
  /** 1920px — listas, detalhes e painéis; é o limite do shell. */
  full: "mx-auto max-w-[1920px]",
} as const;

/** Grade dos formulários: uma coluna no celular e duas a partir de `xl`, com lacunas de 72/96px. */
export const formGrid = "grid gap-9 xl:grid-cols-2 xl:items-start xl:gap-x-12 2xl:gap-x-16";
