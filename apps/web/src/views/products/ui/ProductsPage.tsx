"use client";

import { Package, Plus } from "lucide-react";
import type { Route } from "next";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  PRODUCT_STATUSES,
  ProductStatusBadge,
  productApi,
  productStatusLabel,
  type CategoryOption,
  type UnitOption,
  type ProductStatus,
  type ProductSummary,
} from "@/entities/product";
import { ProductDialog } from "@/features/save-product";
import { withSession } from "@/shared/auth/with-session";
import { useDebounced } from "@/shared/lib/use-debounced";
import { useRemoteList } from "@/shared/lib/use-remote-list";
import { StatusMessage, type Status } from "@/shared/ui/form-primitives";
import {
  DataTable,
  EmptyState,
  FilterBar,
  ListError,
  PageHeader,
  Pagination,
  SearchField,
  SelectField,
  primaryActionClass,
  type Column,
} from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";

const PAGE_SIZE = 20;

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 });
const money = (value: number | null, currency: string) =>
  value === null ? "—" : new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);

const columns: Column<ProductSummary>[] = [
  { id: "sku", header: "SKU", className: "font-mono text-[13px]", cell: (product) => product.sku },
  { id: "name", header: "Produto", className: "font-medium text-foreground", cell: (product) => product.name },
  { id: "category", header: "Categoria", hideBelow: "md", className: "text-ink/60", cell: (product) => product.categoryName ?? "—" },
  {
    id: "stock",
    header: "Estoque",
    align: "right",
    cell: (product) => (
      <span className={product.totalQuantity < product.minStock ? "font-semibold text-warning" : "text-foreground"}>
        {number.format(product.totalQuantity)} {product.unit}
      </span>
    ),
  },
  { id: "min", header: "Mínimo", align: "right", hideBelow: "lg", className: "text-ink/60", cell: (product) => number.format(product.minStock) },
  { id: "cost", header: "Custo padrão", align: "right", hideBelow: "lg", className: "text-ink/60", cell: (product) => money(product.standardCost, product.currency) },
  { id: "status", header: "Status", cell: (product) => <ProductStatusBadge status={product.status} /> },
];

const statusOptions = [
  { value: "", label: "Todos (exceto arquivados)" },
  ...PRODUCT_STATUSES.map((value) => ({ value, label: productStatusLabel[value] })),
];

export function ProductsPage({ initial, initialCategories, initialUnits }: {
  initial: { items: ProductSummary[]; total: number };
  initialCategories: CategoryOption[];
  initialUnits: UnitOption[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProductStatus | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [categories] = useState<CategoryOption[]>(initialCategories);
  const [units] = useState<UnitOption[]>(initialUnits);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notice, setNotice] = useState<Status>(null);
  const q = useDebounced(search.trim());

  const { items, total, loading, error, refresh } = useRemoteList(
    () =>
      withSession(
        productApi.list({ q: q || undefined, status: status || undefined, categoryId: categoryId || undefined, page, pageSize: PAGE_SIZE }),
      ),
    [q, status, categoryId, page], initial,
  );

  const filtered = Boolean(q || status || categoryId);
  const reset = <T,>(set: (value: T) => void) => (value: T) => { set(value); setPage(1); };

  return (
    <Layout title="Produtos">
      <PageHeader
        title="Produtos"
        description="Catálogo de produtos e políticas de reposição."
        actions={<button type="button" onClick={() => setDialogOpen(true)} className={primaryActionClass}><Plus size={17} aria-hidden /> Novo produto</button>}
      />

      <FilterBar>
        <SearchField value={search} onChange={reset(setSearch)} placeholder="Buscar por SKU ou nome" />
        <SelectField label="Filtrar por status" value={status} onChange={reset((value: string) => setStatus(value as ProductStatus | ""))} options={statusOptions} />
        <SelectField
          label="Filtrar por categoria"
          value={categoryId}
          onChange={reset(setCategoryId)}
          options={[{ value: "", label: "Todas as categorias" }, ...categories.map((c) => ({ value: c.id, label: `${"— ".repeat(c.depth)}${c.name}` }))]}
        />
      </FilterBar>

      <div className="mb-4 empty:hidden"><StatusMessage status={notice} /></div>

      {error && <ListError message={error} onRetry={() => void refresh()} />}

      <DataTable
        caption="Lista de produtos"
        columns={columns}
        rows={items}
        getRowKey={(product) => product.id}
        rowHref={(product) => `/products/${product.id}` as Route}
        loading={loading}
        minWidth={780}
        empty={
          !error && (
            <EmptyState
              icon={Package}
              message={filtered ? "Nenhum produto encontrado para esses filtros." : "Nenhum produto cadastrado ainda."}
              action={!filtered && <button type="button" onClick={() => setDialogOpen(true)} className={primaryActionClass}><Plus size={17} aria-hidden /> Cadastrar o primeiro produto</button>}
            />
          )
        }
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} noun={["produto", "produtos"]} />

      <AnimatePresence>
        {dialogOpen && (
          <ProductDialog
            units={units}
            onClose={() => setDialogOpen(false)}
            onCreated={(product) => {
              setNotice({ type: "success", message: `Produto ${product.sku} cadastrado.` });
              void refresh();
            }}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}
