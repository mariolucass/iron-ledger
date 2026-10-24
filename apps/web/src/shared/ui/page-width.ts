/**
 * Larguras de conteúdo, todas na grade de 8pt e alinhadas à esquerda pelo shell.
 * O eixo esquerdo é o mesmo do cabeçalho (16/24/32px), então título, breadcrumb e
 * conteúdo começam sempre na mesma coluna, independente da página ou da tela.
 */
export const pageWidth = {
  /** 720px — formulários de cadastro e edição. */
  form: "max-w-[720px]",
  /** 960px — editores com tabelas ou painéis auxiliares. */
  wide: "max-w-[960px]",
  /** 1280px — listas, detalhes e painéis; é o limite do shell. */
  full: "max-w-[1280px]",
} as const;
