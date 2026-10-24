"use client";
import { Ruler, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { unitApi, unitTypeLabels, type UnitOfMeasure } from "@/entities/unit-of-measure";
import { withSession } from "@/shared/auth/with-session";
import { useDebounced } from "@/shared/lib/use-debounced";
import { useRemoteList } from "@/shared/lib/use-remote-list";
import { DataTable, EmptyState, FilterBar, ListError, PageHeader, Pagination, SearchField, primaryActionClass, type Column } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";

const PAGE_SIZE = 20;
const columns: Column<UnitOfMeasure>[] = [
  { id: "code", header: "Código", className: "font-mono text-[13px]", cell: (unit) => unit.code },
  { id: "name", header: "Unidade", className: "font-medium", cell: (unit) => unit.name },
  { id: "type", header: "Tipo", cell: (unit) => unitTypeLabels[unit.type] },
  { id: "precision", header: "Casas decimais", align: "right", cell: (unit) => unit.precision },
  { id: "status", header: "Status", cell: (unit) => unit.isActive ? "Ativa" : "Inativa" },
];
export function UnitsPage({ initial }: { initial: { items: UnitOfMeasure[]; total: number } }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search.trim());
  const { items, total, loading, error, refresh } = useRemoteList(
    () => withSession(unitApi.list({ q: q || undefined, page, pageSize: PAGE_SIZE })),
    [q, page], initial,
  );
  return <Layout title="Unidades de medida">
    <PageHeader title="Unidades de medida" description="Unidades usadas no cadastro e nas quantidades dos produtos." actions={<Link href="/products/units-of-measure/new" className={primaryActionClass}><Plus size={17} aria-hidden /> Nova unidade</Link>} />
    <FilterBar><SearchField value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Buscar por código ou nome" /></FilterBar>
    {error && <ListError message={error} onRetry={() => void refresh()} />}
    <DataTable caption="Lista de unidades de medida" columns={columns} rows={items} getRowKey={(item) => item.id} loading={loading} minWidth={600} empty={!error && <EmptyState icon={Ruler} message={q ? "Nenhuma unidade encontrada." : "Nenhuma unidade cadastrada ainda."} action={!q && <Link href="/products/units-of-measure/new" className={primaryActionClass}><Plus size={17} aria-hidden /> Cadastrar a primeira unidade</Link>} />} />
    <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} noun={["unidade", "unidades"]} />
  </Layout>;
}
