import type { Metadata } from "next";

/**
 * SEO e compartilhamento do site.
 *
 * - `siteMetadata` é o padrão do site e é exportado pelo layout raiz.
 * - `createMetadata` é usado por TODA página para declarar o seu `metadata`
 *   (ou o retorno de `generateMetadata`).
 *
 * Por que a função devolve blocos completos: o Next faz um merge RASO entre o
 * metadata do layout e o da página. `openGraph`, `twitter`, `robots` e
 * `alternates` definidos numa página substituem os do layout por inteiro, então
 * herdar parcialmente não funciona. Já `title.template` do layout continua
 * valendo para o `title` da página, mas não vale dentro de `openGraph.title` e
 * `twitter.title`, que por isso recebem o título final já formatado.
 */

const NAME = "Iron Ledger";
const DEFAULT_TITLE = `${NAME} | Operações, auditoria e inteligência de estoque`;
const DEFAULT_DESCRIPTION =
  "Plataforma para controle de estoque em tempo real, auditoria imutável, transações distribuídas e análise de dados.";
const MAX_DESCRIPTION_LENGTH = 160;

function resolveSiteUrl(value: string | undefined): URL {
  try {
    return new URL(value || "http://localhost:3001");
  } catch {
    return new URL("http://localhost:3001");
  }
}

export interface SocialImage {
  /** Caminho em `public/` ou URL absoluta. */
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export const siteConfig = {
  name: NAME,
  url: resolveSiteUrl(process.env.NEXT_PUBLIC_APP_URL),
  locale: "pt_BR",
  language: "pt-BR",
  defaultTitle: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "controle de estoque",
    "gestão de inventário",
    "auditoria imutável",
    "rastreabilidade",
    "transações distribuídas",
    "orquestração de workflows",
    "análise de dados",
    "relatórios",
    "alertas",
    "event-driven architecture",
  ],
  ogImage: {
    url: "/og-image.png",
    width: 1200,
    height: 630,
    alt: `${NAME}: operações de estoque`,
  } satisfies SocialImage,
} as const;

const INDEXABLE_ROBOTS = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
} as const satisfies NonNullable<Metadata["robots"]>;

const PRIVATE_ROBOTS = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false, noimageindex: true },
} as const satisfies NonNullable<Metadata["robots"]>;

/** Remove espaços repetidos e corta em ~160 caracteres, sem partir palavra. */
function tidyDescription(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= MAX_DESCRIPTION_LENGTH) return clean;

  const cut = clean.slice(0, MAX_DESCRIPTION_LENGTH - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > MAX_DESCRIPTION_LENGTH * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s.,;:!?-]+$/, "")}…`;
}

/** "/products/?a=1#x" -> "/products"; "/" permanece "/". */
function normalizePath(path: string): string {
  const clean = path.split(/[?#]/)[0] ?? "/";
  return clean.length > 1 ? clean.replace(/\/+$/, "") || "/" : "/";
}

function toImage(image: string | SocialImage | undefined, fallbackAlt: string): SocialImage {
  if (!image) return siteConfig.ogImage;
  return typeof image === "string" ? { url: image, alt: fallbackAlt } : { alt: fallbackAlt, ...image };
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

type Social = Pick<Metadata, "openGraph" | "twitter">;

function social(input: {
  title: string;
  description: string;
  image: SocialImage;
  url?: string;
  type: "website" | "article";
}): Social {
  return {
    openGraph: {
      type: input.type,
      title: input.title,
      description: input.description,
      siteName: NAME,
      locale: siteConfig.locale,
      ...(input.url ? { url: input.url } : {}),
      images: [input.image],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [input.image.url],
    },
  };
}

/** Padrão do site; exportado pelo layout raiz. Páginas sem `createMetadata` herdam isto. */
export const siteMetadata: Metadata = {
  metadataBase: siteConfig.url,
  title: { default: DEFAULT_TITLE, template: `%s | ${NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: NAME,
  keywords: [...siteConfig.keywords],
  category: "business",
  authors: [{ name: NAME }],
  creator: NAME,
  publisher: NAME,
  referrer: "origin-when-cross-origin",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, title: NAME, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false, email: false, address: false },
  // Seguro por padrão: só entra no índice quem pedir (`index: true`). Também vale para o 404.
  robots: PRIVATE_ROBOTS,
  ...social({
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    image: siteConfig.ogImage,
    type: "website",
  }),
};

export interface PageMetadataOptions {
  /**
   * Título da página SEM o nome da marca: o template do layout acrescenta
   * " | Iron Ledger". Omitido, vale o título padrão do site.
   */
  title?: string;
  /** Até ~160 caracteres; excedente é cortado em limite de palavra. */
  description?: string;
  /**
   * Caminho canônico (ex.: "/products"). Define `canonical`, `hreflang` e
   * `og:url`. Omita em rotas dinâmicas sem URL canônica estável.
   */
  path?: `/${string}`;
  /** Imagem de compartilhamento: caminho/URL ou objeto com dimensões. Padrão: `og-image.png`. */
  image?: string | SocialImage;
  /** Somadas às palavras-chave do site, sem repetir. */
  keywords?: readonly string[];
  /**
   * Permite que buscadores indexem a página. Padrão: `false`, porque quase
   * todas as páginas ficam atrás de login. Use `true` só em páginas públicas.
   */
  index?: boolean;
  /** Tipo do Open Graph. Padrão: "website". */
  type?: "website" | "article";
}

/**
 * Metadata completo de uma página: título, descrição, canonical, robots,
 * Open Graph e Twitter Card.
 *
 * @example
 * export const metadata = createMetadata({
 *   title: "Produtos",
 *   description: "Catálogo de produtos e políticas de reposição.",
 *   path: "/products",
 * });
 *
 * @example página pública (landing)
 * export const metadata = createMetadata({ path: "/", index: true });
 *
 * @example página dinâmica
 * export async function generateMetadata({ params }) {
 *   const item = await load((await params).id);
 *   return createMetadata({ title: item.name, description: item.summary });
 * }
 */
export function createMetadata(options: PageMetadataOptions = {}): Metadata {
  const { title, path, index = false, type = "website" } = options;

  const pageTitle = title?.replace(/\s+/g, " ").trim() || undefined;
  const fullTitle = pageTitle ? `${pageTitle} | ${NAME}` : DEFAULT_TITLE;
  const description = tidyDescription(options.description ?? DEFAULT_DESCRIPTION) || DEFAULT_DESCRIPTION;
  const canonical = path ? normalizePath(path) : undefined;
  const image = toImage(options.image, fullTitle);

  return {
    ...(pageTitle ? { title: pageTitle } : {}),
    description,
    ...(options.keywords?.length ? { keywords: unique([...siteConfig.keywords, ...options.keywords]) } : {}),
    ...(canonical ? { alternates: { canonical, languages: { [siteConfig.language]: canonical } } } : {}),
    robots: index ? INDEXABLE_ROBOTS : PRIVATE_ROBOTS,
    ...social({ title: fullTitle, description, image, url: canonical, type }),
  };
}
