"use client";

import { Archive } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductStatusBadge, productApi, type Product, type ProductLookups } from "@/entities/product";
import { ProductForm } from "@/features/save-product";
import { withSession } from "@/shared/auth/with-session";
import { PageHeader, secondaryActionClass } from "@/shared/ui/data-list";
import { Button } from "@/shared/ui/kit/button";
import { StatusMessage, type Status } from "@/shared/ui/form-primitives";
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
      .then(([lookups, product]) => { if (!cancelled) setState({ phase: "ready", lookups, product }); })
      .catch((reason) => {
        if (!cancelled) setState({ phase: "error", message: reason instanceof Error ? reason.message : "Não foi possível carregar o produto." });
      });
    return () => { cancelled = true; };
  }, [productId, attempt]);

  const product = state.phase === "ready" ? state.product : undefined;

  const archive = async () => {
    if (!product) return;
    setArchiving(true);
    try {
      await withSession(productApi.archive(product.id));
      router.push("/products");
    } catch (reason) {
      setNotice({ type: "error", message: reason instanceof Error ? reason.message : "Não foi possível arquivar o produto." });
      setConfirmingArchive(false);
      setArchiving(false);
    }
  };

  return (
    <Layout title={product ? product.name : "Novo produto"}>
      <PageHeader
        back={{ href: "/products", label: "Produtos" }}
        title={productId ? (product?.name ?? "Produto") : "Novo produto"}
        badges={product && <ProductStatusBadge status={product.status} />}
        meta={product && <span className="font-mono">{product.sku}</span>}
        actions={
          product && product.status !== "ARCHIVED" ? (
            confirmingArchive ? (
              <>
                <span className="text-[13.5px] text-white/60">Arquivar este produto?</span>
                <Button variant="ghost" onClick={() => setConfirmingArchive(false)} disabled={archiving}>Cancelar</Button>
                <Button variant="destructive" onClick={() => void archive()} disabled={archiving}>{archiving ? "Arquivando…" : "Confirmar"}</Button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmingArchive(true)} className={secondaryActionClass}><Archive size={16} aria-hidden /> Arquivar</button>
            )
          ) : undefined
        }
      />

      <div className="mb-4 max-w-[960px]"><StatusMessage status={notice} /></div>

      {state.phase === "loading" && <div className="h-96 max-w-[960px] animate-pulse rounded-xl bg-white/[0.035]" aria-label="Carregando" />}
      {state.phase === "error" && (
        <div role="alert" className="grid max-w-[960px] justify-items-start gap-4">
          <p className="m-0 text-sm text-destructive">{state.message}</p>
          <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>Tentar novamente</Button>
        </div>
      )}
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
    </Layout>
  );
}
