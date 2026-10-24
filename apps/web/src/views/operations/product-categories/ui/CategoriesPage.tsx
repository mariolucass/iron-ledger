"use client";
import { FolderTree, Plus } from "lucide-react";
import { useState } from "react";
import { categoryApi, type Category } from "@/entities/category";
import { withSession } from "@/shared/auth/with-session";
import { useDebounced } from "@/shared/lib/use-debounced";
import { useRemoteList } from "@/shared/lib/use-remote-list";
import { DataTable, EmptyState, FilterBar, ListError, PageHeader, Pagination, SearchField, primaryActionClass, type Column } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";
import Link from "next/link";

const PAGE_SIZE = 20;
const columns: Column<Category>[] = [
  { id: "name", header: "Categoria", className: "font-medium", cell: (item) => <span style={{ paddingLeft: `${Math.min(item.depth, 8) * 18}px` }}>{item.name}</span> },
  { id: "code", header: "Código", className: "font-mono text-[13px]", cell: (item) => item.code },
  { id: "path", header: "Caminho", hideBelow: "md", className: "text-ink/60", cell: (item) => item.path },
  { id: "status", header: "Status", cell: (item) => item.isActive ? "Ativa" : "Inativa" },
];
export function CategoriesPage({ initial }: { initial: { items: Category[]; total: number } }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search.trim());
  const { items, total, loading, error, refresh } = useRemoteList(
    () => withSession(categoryApi.list({ q: q || undefined, page, pageSize: PAGE_SIZE })),
    [q, page], initial,
  );
  return <Layout title="Categorias">
    <PageHeader title="Categorias" description="Organize os produtos em categorias e subcategorias." actions={<Link href="/products/categories/new" className={primaryActionClass}><Plus size={17} aria-hidden /> Nova categoria</Link>} />
    <FilterBar><SearchField value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Buscar por código ou nome" /></FilterBar>
    {error && <ListError message={error} onRetry={() => void refresh()} />}
    <DataTable caption="Lista de categorias" columns={columns} rows={items} getRowKey={(item) => item.id} loading={loading} minWidth={600} empty={!error && <EmptyState icon={FolderTree} message={q ? "Nenhuma categoria encontrada." : "Nenhuma categoria cadastrada ainda."} action={!q && <Link href="/products/categories/new" className={primaryActionClass}><Plus size={17} aria-hidden /> Cadastrar a primeira categoria</Link>} />} />
    <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} noun={["categoria", "categorias"]} />
  </Layout>;
}
