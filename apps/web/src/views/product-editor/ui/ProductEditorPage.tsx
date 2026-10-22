"use client";

import { Archive } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ProductStatusBadge,
  productApi,
  type Product,
  type ProductLookups,
} from "@/entities/product";
import { ProductForm } from "@/features/save-product";
import { withSession } from "@/shared/auth/with-session";
import { secondaryActionClass } from "@/shared/ui/data-list";
import { Button } from "@/shared/ui/kit/button";
import type { Status } from "@/shared/ui/form-primitives";
import { FormPage } from "@/shared/ui/form-page";
import { Layout } from "@/widgets/layout";

type State =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; lookups: ProductLookups; product?: Product };

/** Cadastro (sem `productId`) e edição de produto. */
export function ProductEditorPage({ productId }: { productId?: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ phase: "loading" });
  const [notice, setNotice] = useState<Status>(null);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ phase: "loading" });
    Promise.all([
      withSession(productApi.lookups()),
      productId ? withSession(productApi.get(productId)) : Promise.resolve(undefined),
    ])
      .then(([lookups, product]) => {
        if (!cancelled) setState({ phase: "ready", lookups, product });
      })
      .catch((reason) => {
        if (!cancelled)
          setState({
            phase: "error",
            message:
              reason instanceof Error ? reason.message : "Não foi possível carregar o produto.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [productId, attempt]);

  const product = state.phase === "ready" ? state.product : undefined;

  const archive = async () => {
    if (!product) return;
    setArchiving(true);
    try {
      await withSession(productApi.archive(product.id));
      router.push("/products");
    } catch (reason) {
      setNotice({
        type: "error",
        message: reason instanceof Error ? reason.message : "Não foi possível arquivar o produto.",
      });
      setConfirmingArchive(false);
      setArchiving(false);
    }
  };

  return (
    <Layout title={product ? product.name : "Novo produto"}>
      <FormPage
        back={{ href: "/products", label: "Produtos" }}
        title={productId ? (product?.name ?? "Produto") : "Novo produto"}
        description={
          productId
            ? undefined
            : "Cadastre um produto no catálogo. SKU, nome e unidade são obrigatórios."
        }
        badges={product && <ProductStatusBadge status={product.status} />}
        meta={product && <span className="font-mono">{product.sku}</span>}
        actions={
          product && product.status !== "ARCHIVED" ? (
            confirmingArchive ? (
              <>
                <span className="text-[13.5px] text-ink/60">Arquivar este produto?</span>
                <Button
                  variant="ghost"
                  onClick={() => setConfirmingArchive(false)}
                  disabled={archiving}
                >
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={() => void archive()} disabled={archiving}>
                  {archiving ? "Arquivando…" : "Confirmar"}
                </Button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingArchive(true)}
                className={secondaryActionClass}
              >
                <Archive size={16} aria-hidden /> Arquivar
              </button>
            )
          ) : undefined
        }
        loading={state.phase === "loading"}
        error={state.phase === "error" ? state.message : undefined}
        onRetry={() => setAttempt((n) => n + 1)}
        notice={notice}
      >
        {state.phase === "ready" && (
          <ProductForm
            key={product?.version ?? "new"}
            product={state.product}
            lookups={state.lookups}
            onCancel={() => router.push("/products")}
            onSaved={(saved, mode) => {
              if (mode === "created") {
                router.push(`/products/${saved.id}`);
                return;
              }
              setState({ phase: "ready", lookups: state.lookups, product: saved });
              setNotice({ type: "success", message: "Produto atualizado." });
            }}
          />
        )}
      </FormPage>
    </Layout>
  );
}
