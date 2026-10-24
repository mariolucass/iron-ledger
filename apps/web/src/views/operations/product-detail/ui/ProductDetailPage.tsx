"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, ImageOff, Pencil, RefreshCw } from "lucide-react";
import {
  productApi,
  ProductStatusBadge,
  trackingModeLabel,
  type Product,
} from "@/entities/product";
import { withSession } from "@/shared/auth/with-session";
import { primaryActionClass, secondaryActionClass } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 });
const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });

function metric(value: number | null | undefined, unit = "") {
  return value == null ? "—" : `${number.format(value)}${unit ? ` ${unit}` : ""}`;
}

function money(value: number | null, currency: string) {
  if (value == null) return "—";
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
  } catch {
    return `${number.format(value)} ${currency}`;
  }
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border py-3 last:border-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function ProductDetailPage({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [failedImages, setFailedImages] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    withSession(productApi.get(productId))
      .then((result) => {
        if (!cancelled) {
          setProduct(result);
          setSelectedImage(0);
          setFailedImages([]);
          setLoading(false);
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(
            reason instanceof Error ? reason.message : "Não foi possível carregar o produto.",
          );
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [productId, attempt]);

  const images = product?.images ?? [];
  const cover = images[selectedImage];
  const stock = product?.stockSummary;
  const belowMinimum = Boolean(product && stock && stock.quantity < product.minStock);
  const needsReorder = Boolean(
    product && stock && product.reorderPoint != null && stock.available <= product.reorderPoint,
  );

  return (
    <Layout title={product?.name ?? "Produto"}>
      <div className="pb-12">
        <Link
          href="/products"
          className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Produtos
        </Link>
        {loading ? (
          <div
            role="status"
            className="rounded-2xl border border-border bg-card p-8 text-muted-foreground"
          >
            Carregando produto…
          </div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-border bg-card p-8">
            <p className="font-semibold">Não foi possível carregar o produto.</p>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className={`${secondaryActionClass} mt-4`}
            >
              <RefreshCw size={16} /> Tentar novamente
            </button>
          </div>
        ) : (
          product && (
            <>
              <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <ProductStatusBadge status={product.status} />
                    <span className="rounded-full border border-border px-2.5 py-1 font-mono text-xs text-muted-foreground">
                      {product.sku}
                    </span>
                  </div>
                  <h1 className="m-0 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                    {product.name}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {product.categoryName ?? "Sem categoria"} · Atualizado em{" "}
                    {date.format(new Date(product.updatedAt))}
                  </p>
                </div>
                <Link href={`/products/${product.id}/edit` as Route} className={primaryActionClass}>
                  <Pencil size={16} aria-hidden /> Editar produto
                </Link>
              </header>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <section aria-label="Fotos do produto" className="min-w-0">
                  <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/40">
                    {cover && !failedImages.includes(selectedImage) ? (
                      <img
                        src={cover}
                        alt={`${product.name} — foto ${selectedImage + 1}`}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-contain"
                        onError={() => setFailedImages((current) => [...current, selectedImage])}
                      />
                    ) : (
                      <div className="grid justify-items-center gap-3 text-center text-muted-foreground">
                        <ImageOff size={42} strokeWidth={1.4} aria-hidden />
                        <p className="m-0 text-sm">
                          {cover
                            ? "Não foi possível carregar esta foto"
                            : "Nenhuma foto cadastrada"}
                        </p>
                      </div>
                    )}
                  </div>
                  {images.length > 1 && (
                    <div className="mt-3 flex flex-wrap gap-2" aria-label="Selecionar foto">
                      {images.map((image, index) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          aria-label={`Ver foto ${index + 1}`}
                          aria-pressed={selectedImage === index}
                          onClick={() => setSelectedImage(index)}
                          className={`size-20 overflow-hidden rounded-xl border-2 bg-muted/40 ${selectedImage === index ? "border-primary" : "border-border"}`}
                        >
                          {failedImages.includes(index) ? (
                            <ImageOff className="mx-auto text-muted-foreground" size={22} />
                          ) : (
                            <img
                              src={image}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                              onError={() => setFailedImages((current) => [...current, index])}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {product.description && (
                    <section className="mt-6 rounded-2xl border border-border bg-card p-5">
                      <h2 className="m-0 text-base font-semibold">Sobre o produto</h2>
                      <p className="mb-0 mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {product.description}
                      </p>
                    </section>
                  )}
                </section>

                <div className="grid content-start gap-5">
                  <section className="rounded-2xl border border-border bg-card p-5">
                    <h2 className="m-0 text-base font-semibold">Visão do estoque</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Saldo consolidado em todos os armazéns
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      {[
                        ["Saldo físico", metric(stock?.quantity, product.unit)],
                        ["Disponível", metric(stock?.available, product.unit)],
                        ["Reservado", metric(stock?.reserved, product.unit)],
                        ["Em trânsito", metric(stock?.incoming, product.unit)],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl bg-muted/50 p-4">
                          <p className="m-0 text-xs text-muted-foreground">{label}</p>
                          <p className="mb-0 mt-2 text-xl font-semibold tabular-nums">{value}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mb-0 mt-4 text-sm text-muted-foreground">
                      {stock
                        ? `${stock.warehouses} ${stock.warehouses === 1 ? "armazém com saldo" : "armazéns com saldo"}`
                        : "Resumo de estoque indisponível"}
                    </p>
                    {(belowMinimum || needsReorder) && (
                      <p className="mb-0 mt-3 rounded-lg bg-warning/10 p-3 text-sm text-warning">
                        {belowMinimum
                          ? "Saldo abaixo do mínimo cadastrado."
                          : "Disponível no ponto de reposição ou abaixo dele."}
                      </p>
                    )}
                  </section>
                  <section className="rounded-2xl border border-border bg-card p-5">
                    <h2 className="m-0 text-base font-semibold">Reposição e custo</h2>
                    <dl className="mt-3 grid grid-cols-2 gap-x-5">
                      <Info label="Estoque mínimo" value={metric(product.minStock, product.unit)} />
                      <Info
                        label="Ponto de reposição"
                        value={metric(product.reorderPoint, product.unit)}
                      />
                      <Info
                        label="Estoque de segurança"
                        value={metric(product.safetyStock, product.unit)}
                      />
                      <Info label="Estoque máximo" value={metric(product.maxStock, product.unit)} />
                      <Info label="Prazo de entrega" value={metric(product.leadTimeDays, "dias")} />
                      <Info
                        label="Custo padrão por unidade"
                        value={money(product.standardCost, product.currency)}
                      />
                    </dl>
                  </section>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <section className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="m-0 text-base font-semibold">Identificação e logística</h2>
                  <dl className="mt-3 grid grid-cols-2 gap-x-5">
                    <Info label="Unidade base" value={product.unit} />
                    <Info label="Rastreabilidade" value={trackingModeLabel[product.trackingMode]} />
                    <Info label="NCM" value={product.ncm ?? "—"} />
                    <Info label="Validade" value={metric(product.shelfLifeDays, "dias")} />
                    <Info label="Peso" value={metric(product.weightKg, "kg")} />
                    <Info
                      label="Dimensões (C × L × A)"
                      value={
                        product.lengthCm != null &&
                        product.widthCm != null &&
                        product.heightCm != null
                          ? `${number.format(product.lengthCm)} × ${number.format(product.widthCm)} × ${number.format(product.heightCm)} cm`
                          : "—"
                      }
                    />
                  </dl>
                </section>
                <section className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="m-0 text-base font-semibold">Códigos de barras</h2>
                  {product.barcodes.length ? (
                    <ul className="mt-4 grid gap-2 p-0">
                      {product.barcodes.map((barcode) => (
                        <li
                          key={barcode.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm"
                        >
                          <span className="font-mono">{barcode.code}</span>
                          <span className="text-muted-foreground">
                            {barcode.type.replaceAll("_", " ")} ·{" "}
                            {metric(barcode.quantity, product.unit)}
                            {barcode.isPrimary ? " · Principal" : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum código cadastrado.</p>
                  )}
                  <p className="mb-0 mt-4 text-xs text-muted-foreground">
                    Criado em {date.format(new Date(product.createdAt))} · Versão {product.version}
                  </p>
                </section>
              </div>
              <nav aria-label="Explorar produto" className="mt-6 rounded-2xl border border-border bg-card p-5">
                <h2 className="m-0 text-base font-semibold">Explorar produto</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {([
                    ["inventory", "Estoque"], ["movements", "Movimentações"],
                    ["lots", "Lotes"], ["barcodes", "Códigos de barras"],
                    ["units", "Conversões"], ["forecast", "Previsão"],
                    ["audit-log", "Auditoria"],
                  ] as const).map(([path, label]) => (
                    <Link key={path} href={`/products/${product.id}/${path}` as Route} className={secondaryActionClass}>
                      {label}
                    </Link>
                  ))}
                </div>
              </nav>
            </>
          )
        )}
      </div>
    </Layout>
  );
}
