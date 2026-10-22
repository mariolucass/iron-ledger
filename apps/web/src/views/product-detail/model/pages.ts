import type { Route } from "next";
import type { PlannedPage } from "@/shared/config/planned-page";

/** Páginas de um produto (catalog.Product e relações). */
export const productDetailPages = {
  inventory: (id: string): PlannedPage => ({
    title: "Estoque do produto",
    description: "Distribuição do estoque deste produto entre armazéns.",
    back: { href: `/products/${id}` as Route, label: "Produto" },
  }),
  movements: (id: string): PlannedPage => ({
    title: "Movimentações do produto",
    description: "Entradas, saídas e ajustes deste produto em todos os armazéns.",
    back: { href: `/products/${id}` as Route, label: "Produto" },
  }),
  lots: (id: string): PlannedPage => ({
    title: "Lotes do produto",
    description: "Lotes e números de série deste produto, com situação e validade.",
    back: { href: `/products/${id}` as Route, label: "Produto" },
  }),
  barcodes: (id: string): PlannedPage => ({
    title: "Códigos de barras",
    description: "Códigos EAN, UPC, GTIN, Code 128, QR e internos, com quantidade por embalagem.",
    back: { href: `/products/${id}` as Route, label: "Produto" },
  }),
  units: (id: string): PlannedPage => ({
    title: "Conversões de unidade",
    description: "Fatores de conversão entre a unidade base do produto e outras unidades de medida.",
    back: { href: `/products/${id}` as Route, label: "Produto" },
  }),
  forecast: (id: string): PlannedPage => ({
    title: "Previsão de demanda do produto",
    description: "Demanda prevista, intervalo de confiança e realizado deste produto.",
    back: { href: `/products/${id}` as Route, label: "Produto" },
  }),
  auditLog: (id: string): PlannedPage => ({
    title: "Auditoria do produto",
    description: "Alterações de cadastro, preço e políticas de reposição deste produto.",
    back: { href: `/products/${id}` as Route, label: "Produto" },
  }),
} satisfies Record<string, PlannedPage | ((...params: string[]) => PlannedPage)>;
