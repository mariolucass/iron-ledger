import assert from "node:assert/strict";
import { test } from "node:test";
import { createMetadata, siteConfig, siteMetadata } from "../src/shared/config/metadata";

const og = (metadata: ReturnType<typeof createMetadata>) => metadata.openGraph as Record<string, unknown>;
const twitter = (metadata: ReturnType<typeof createMetadata>) => metadata.twitter as Record<string, unknown>;

test("título da página não leva a marca (o template do layout acrescenta) e og/twitter recebem o título final", () => {
  const metadata = createMetadata({ title: "Produtos", description: "Catálogo.", path: "/products" });
  assert.equal(metadata.title, "Produtos");
  assert.equal(og(metadata).title, "Produtos | Iron Ledger");
  assert.equal(twitter(metadata).title, "Produtos | Iron Ledger");
});

test("sem título usa o padrão do site (não define `title`, herdando o default do layout)", () => {
  const metadata = createMetadata();
  assert.equal("title" in metadata, false);
  assert.equal(og(metadata).title, siteConfig.defaultTitle);
  assert.equal(metadata.description, siteConfig.description);
});

test("o layout define o template e o título padrão", () => {
  assert.deepEqual(siteMetadata.title, { default: siteConfig.defaultTitle, template: "%s | Iron Ledger" });
});

test("noindex por padrão; index: true só quando pedido", () => {
  const privatePage = createMetadata({ title: "Dashboard" });
  assert.equal((privatePage.robots as { index: boolean }).index, false);
  assert.equal((privatePage.robots as { follow: boolean }).follow, false);
  const publicPage = createMetadata({ index: true });
  assert.equal((publicPage.robots as { index: boolean }).index, true);
  assert.equal((siteMetadata.robots as { index: boolean }).index, false);
});

test("path gera canonical, hreflang e og:url normalizados; sem path nada disso é emitido", () => {
  const withPath = createMetadata({ path: "/products/?page=2#top" });
  assert.deepEqual(withPath.alternates, { canonical: "/products", languages: { "pt-BR": "/products" } });
  assert.equal(og(withPath).url, "/products");
  assert.equal(createMetadata({ path: "/" }).alternates?.canonical, "/");

  const dynamic = createMetadata({ title: "Produto" });
  assert.equal(dynamic.alternates, undefined);
  assert.equal("url" in og(dynamic), false);
});

test("o layout não define canonical (seria herdado por todas as páginas)", () => {
  assert.equal(siteMetadata.alternates, undefined);
});

test("descrição: espaços normalizados e corte em limite de palavra com reticências", () => {
  assert.equal(createMetadata({ description: "  um   texto \n curto " }).description, "um texto curto");

  const long = createMetadata({ description: "palavra ".repeat(60) });
  const text = long.description as string;
  assert.ok(text.length <= 160, `${text.length} caracteres`);
  assert.ok(text.endsWith("…"));
  assert.ok(!text.includes("palavr…"), "não deve partir palavra");
  assert.equal(og(long).description, text);
});

test("sempre emite og:image e twitter:image (merge raso: não dá para herdar)", () => {
  const metadata = createMetadata({ title: "X" });
  assert.deepEqual((og(metadata).images as unknown[])[0], siteConfig.ogImage);
  assert.deepEqual(twitter(metadata).images, [siteConfig.ogImage.url]);
  assert.equal(twitter(metadata).card, "summary_large_image");
  assert.equal(og(metadata).locale, "pt_BR");
  assert.equal(og(metadata).siteName, "Iron Ledger");
});

test("imagem personalizada: string ou objeto", () => {
  const byString = createMetadata({ title: "Relatório", image: "/img/r.png" });
  assert.deepEqual((og(byString).images as unknown[])[0], { url: "/img/r.png", alt: "Relatório | Iron Ledger" });
  const byObject = createMetadata({ image: { url: "/a.png", width: 800, height: 400, alt: "Alt" } });
  assert.deepEqual((og(byObject).images as unknown[])[0], { url: "/a.png", width: 800, height: 400, alt: "Alt" });
});

test("palavras-chave somam as do site sem repetir; sem keywords herda as do layout", () => {
  const metadata = createMetadata({ keywords: ["estoque", " controle de estoque ", "wms"] });
  const keywords = metadata.keywords as string[];
  assert.equal(new Set(keywords).size, keywords.length);
  assert.ok(keywords.includes("wms") && keywords.includes("alertas"));
  assert.equal("keywords" in createMetadata(), false);
});

test("type article é repassado ao Open Graph", () => {
  assert.equal(og(createMetadata({ type: "article" })).type, "article");
  assert.equal(og(createMetadata()).type, "website");
});
