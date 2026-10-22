"use client";

import { Boxes, Layers, MapPin, Plus, Warehouse as WarehouseIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  WAREHOUSE_TYPES,
  warehouseApi,
  warehouseTypeLabel,
  type WarehouseSummary,
  type WarehouseType,
} from "@/entities/warehouse";
import { WarehouseDialog } from "@/features/save-warehouse";
import { withSession } from "@/shared/auth/with-session";
import { useDebounced } from "@/shared/lib/use-debounced";
import { useRemoteList } from "@/shared/lib/use-remote-list";
import {
  EmptyState,
  FilterBar,
  ListError,
  PageHeader,
  SearchField,
  SelectField,
  StatCard,
  primaryActionClass,
} from "@/shared/ui/data-list";
import { StatusMessage, type Status } from "@/shared/ui/form-primitives";
import { Badge } from "@/shared/ui/kit/badge";
import { CardGridSkeleton } from "@/shared/ui/page-skeletons";
import { Layout } from "@/widgets/layout";

const PAGE_SIZE = 100;
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 });

type StatusFilter = "active" | "inactive" | "all";

const statusOptions = [
  { value: "active", label: "Ativas" },
  { value: "inactive", label: "Inativas" },
  { value: "all", label: "Todas" },
];

function WarehouseCard({ warehouse }: { warehouse: WarehouseSummary }) {
  const stats = [
    ["Unidades", number.format(warehouse.totalQuantity)],
    ["Reservado", number.format(warehouse.reserved)],
    ["SKUs", String(warehouse.skuCount)],
    ["Locais", String(warehouse.locationCount)],
  ];
  return (
    <Link
      href={`/warehouses/${warehouse.id}` as Route}
      className={`group grid gap-4 rounded-[24px] border border-ink/10 bg-ink/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-[border-color,background-color,transform] duration-200 outline-none hover:-translate-y-0.5 hover:border-ink/20 hover:bg-ink/[0.06] focus-visible:ring-2 focus-visible:ring-primary/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${warehouse.isActive ? "" : "opacity-70"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[13px] text-ink/55">{warehouse.code}</div>
          <h2 className="m-0 mt-1 truncate text-[18px] font-semibold tracking-[-0.025em] text-foreground group-hover:text-primary">
            {warehouse.name}
          </h2>
          {(warehouse.city || warehouse.state) && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-ink/55">
              <MapPin size={13} aria-hidden />{" "}
              {[warehouse.city, warehouse.state].filter(Boolean).join(", ")}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge variant={warehouse.isActive ? "success" : "secondary"}>
            {warehouse.isActive ? "Ativa" : "Inativa"}
          </Badge>
          <Badge variant="outline">{warehouseTypeLabel[warehouse.type]}</Badge>
        </div>
      </div>
      <dl className="m-0 grid grid-cols-4 gap-2 border-t border-ink/[0.08] pt-4 text-center">
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[12.5px] text-ink/55">{label}</dt>
            <dd className="m-0 mt-0.5 text-[15px] font-semibold text-foreground tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </Link>
  );
}

export function WarehousesPage({ initial }: { initial: { items: WarehouseSummary[]; total: number } }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [type, setType] = useState<WarehouseType | "">("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notice, setNotice] = useState<Status>(null);
  const q = useDebounced(search.trim());

  const { items, total, loading, error, refresh } = useRemoteList(
    () =>
      withSession(
        warehouseApi.search({
          q: q || undefined,
          status,
          type: type || undefined,
          pageSize: PAGE_SIZE,
        }),
      ),
    [q, status, type], initial,
  );

  const units = items.reduce((sum, item) => sum + item.totalQuantity, 0);
  const locations = items.reduce((sum, item) => sum + item.locationCount, 0);
  const filtered = Boolean(q || type || status !== "active");

  return (
    <Layout title="Armazéns">
      <PageHeader
        title="Armazéns"
        description="Instalações, localizações e estoque por unidade."
        actions={
          <button type="button" onClick={() => setDialogOpen(true)} className={primaryActionClass}>
            <Plus size={17} aria-hidden /> Registrar instalação
          </button>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={WarehouseIcon} label="Instalações" value={String(total)} />
        <StatCard icon={Boxes} label="Unidades em estoque" value={number.format(units)} />
        <StatCard icon={Layers} label="Localizações" value={number.format(locations)} />
      </div>

      <FilterBar>
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar por código, nome ou cidade"
          label="Buscar armazéns"
        />
        <SelectField
          label="Filtrar por situação"
          value={status}
          onChange={(value) => setStatus(value as StatusFilter)}
          options={statusOptions}
        />
        <SelectField
          label="Filtrar por tipo"
          value={type}
          onChange={(value) => setType(value as WarehouseType | "")}
          options={[
            { value: "", label: "Todos os tipos" },
            ...WAREHOUSE_TYPES.map((value) => ({ value, label: warehouseTypeLabel[value] })),
          ]}
        />
      </FilterBar>

      <div className="mb-4 empty:hidden"><StatusMessage status={notice} /></div>

      {error && <ListError message={error} onRetry={() => void refresh()} />}

      {loading && items.length === 0 && !error && <CardGridSkeleton count={3} />}

      <div
        className={`grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))] transition-opacity duration-150 motion-reduce:transition-none ${loading ? "opacity-60" : ""}`}
        aria-busy={loading}
      >
        {items.map((warehouse) => (
          <WarehouseCard key={warehouse.id} warehouse={warehouse} />
        ))}
      </div>

      {!loading && items.length === 0 && !error && (
        <div className="rounded-[24px] border border-ink/10 bg-ink/[0.03] backdrop-blur-xl">
          <EmptyState
            icon={WarehouseIcon}
            message={
              filtered
                ? "Nenhuma instalação encontrada para esses filtros."
                : "Nenhuma instalação cadastrada ainda."
            }
            action={
              !filtered && (
                <button type="button" onClick={() => setDialogOpen(true)} className={primaryActionClass}>
                  <Plus size={17} aria-hidden /> Registrar a primeira instalação
                </button>
              )
            }
          />
        </div>
      )}

      <AnimatePresence>
        {dialogOpen && (
          <WarehouseDialog
            onClose={() => setDialogOpen(false)}
            onCreated={(warehouse) => {
              setNotice({ type: "success", message: `Instalação ${warehouse.code} registrada.` });
              void refresh();
            }}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}
