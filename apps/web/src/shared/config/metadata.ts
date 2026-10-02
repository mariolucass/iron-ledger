import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
const PRODUCT_NAME = "Iron Ledger";
const TITLE = `${PRODUCT_NAME} | Operações, auditoria e inteligência de estoque`;
const DESCRIPTION =
  "Plataforma para controle de estoque em tempo real, auditoria imutável, transações distribuídas e análise de dados.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  title: {
    default: TITLE,
    template: `%s | ${PRODUCT_NAME}`,
  },

  description: DESCRIPTION,

  applicationName: PRODUCT_NAME,
  category: "business",
  creator: PRODUCT_NAME,
  publisher: PRODUCT_NAME,

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

  alternates: {
    canonical: "/",
    languages: {
      "pt-BR": "/",
    },
  },

  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: PRODUCT_NAME,
    locale: "pt_BR",
    type: "website",
  },

  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/logo.png",
  },

  appleWebApp: {
    capable: true,
    title: PRODUCT_NAME,
    statusBarStyle: "black-translucent",
  },

  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};
