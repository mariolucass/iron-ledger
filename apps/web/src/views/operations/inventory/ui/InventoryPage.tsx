"use client";

import { AnimatePresence } from "framer-motion";
import { ExternalLink, Package, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { InventoryStatusBadge, type InventoryStatus } from "@/entities/inventory";
import { MovementDialog } from "@/features/operations/record-stock-movement";
import { useDebounced } from "@/shared/lib/use-debounced";
import { useRemoteList } from "@/shared/lib/use-remote-list";
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
  secondaryActionClass,
  type Column,
} from "@/shared/ui/data-list";
import { StatusMessage, type Status } from "@/shared/ui/form-primitives";
import { Layout } from "@/widgets/layout";
import type { InventoryItem, Movement } from "../model/inventoryData";
import { fetchInventoryPage, fetchMovementOptions, fetchMovements, PAGE_SIZE } from "../model/load-inventory";
import { InventoryDrawer } from "./InventoryDrawer";
import { MovementTable } from "./MovementHistory";

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 });

const availableClass: Record<InventoryStatus, string> = { OK: "text-foreground", LOW: "text-warning", CRITICAL: "text-destructive" };

const columns: Column<InventoryItem>[] = [
  { id: "sku", header: "SKU", className: "font-mono text-[13px] text-ink/60", cell: (row) => row.sku },
  { id: "product", header: "Produto", className: "font-medium text-foreground", cell: (row) => row.product },
  { id: "warehouse", header: "Depósito", hideBelow: "md", className: "text-ink/60", cell: (row) => row.warehouse },
  { id: "quantity", header: "Saldo total", align: "right", hideBelow: "lg", className: "text-ink/70", cell: (row) => `${number.format(row.quantity)} ${row.unit ?? "un"}` },
  {
    id: "available",
    header: "Disponível",
    align: "right",
    className: "font-semibold",
    cell: (row) => <span className={availableClass[row.status]}>{number.format(row.available)}</span>,
  },
  { id: "reserved", header: "Reservado", align: "right", hideBelow: "lg", className: "text-ink/60", cell: (row) => number.format(row.reserved) },
  { id: "min", header: "Mínimo", align: "right", hideBelow: "xl", className: "text-ink/60", cell: (row) => number.format(row.min) },
  { id: "status", header: "Status", cell: (row) => <InventoryStatusBadge status={row.status} /> },
  { id: "last", header: "Últ. movimento", hideBelow: "xl", className: "whitespace-nowrap text-[13px] text-ink/60", cell: (row) => row.lastMovement },
];

export function InventoryPage({ initial, initialWarehouses }: {
  initial: { items: InventoryItem[]; total: number };
  initialWarehouses: { value: string; label: string }[];
}) {
  const [search, setSearch] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [page, setPage] = useState(1);
  const [warehouses] = useState<{ value: string; label: string }[]>(initialWarehouses);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [movements, setMovements] = useState<Record<string, Movement[]>>({});
  const [loadingMovements, setLoadingMovements] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<InventoryItem | null>(null);
  const [dialogItems, setDialogItems] = useState<InventoryItem[] | null>(null);
  const [openingDialog, setOpeningDialog] = useState(false);
  const [notice, setNotice] = useState<Status>(null);
  const q = useDebounced(search.trim());

  const { items, total, loading, error, refresh } = useRemoteList(
    () => fetchInventoryPage({ q: q || undefined, warehouseId: warehouse || undefined, page }),
    [q, warehouse, page], initial,
  );

  const toggle = async (row: InventoryItem) => {
    if (expandedId === row.stockLevelId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(row.stockLevelId);
    if (movements[row.stockLevelId]) return;
    setLoadingMovements(row.stockLevelId);
    try {
      const history = await fetchMovements(row.stockLevelId);
      setMovements((current) => ({ ...current, [row.stockLevelId]: history }));
    } catch (reason) {
      setNotice({ type: "error", message: reason instanceof Error ? reason.message : "Não foi possível carregar os movimentos." });
    } finally {
      setLoadingMovements((current) => (current === row.stockLevelId ? null : current));
    }
  };

  const openMovementDialog = async () => {
    setOpeningDialog(true);
    try {
      setDialogItems(await fetchMovementOptions());
    } catch (reason) {
      setNotice({ type: "error", message: reason instanceof Error ? reason.message : "Não foi possível carregar os saldos." });
    } finally {
      setOpeningDialog(false);
    }
  };

  const filtered = Boolean(q || warehouse);
  const reset = <T,>(set: (value: T) => void) => (value: T) => { set(value); setPage(1); setExpandedId(null); };

  return (
    <Layout title="Estoque">
      <PageHeader
        title="Estoque"
        description="Saldos por produto e depósito, com o reservado já descontado."
        actions={
          <button type="button" onClick={() => void openMovementDialog()} disabled={openingDialog || Boolean(error) || (!loading && items.length === 0 && !filtered)} className={`${primaryActionClass} disabled:cursor-not-allowed disabled:opacity-50`}>
            <Plus size={17} aria-hidden /> {openingDialog ? "Carregando…" : "Novo movimento"}
          </button>
        }
      />

      <FilterBar columns="md:grid-cols-[1fr_240px]">
        <SearchField value={search} onChange={reset(setSearch)} placeholder="Buscar por SKU ou nome" />
        <SelectField label="Filtrar por depósito" value={warehouse} onChange={reset(setWarehouse)} options={[{ value: "", label: "Todos os depósitos" }, ...warehouses]} />
      </FilterBar>

      <div className="mb-4 empty:hidden"><StatusMessage status={notice} /></div>
      {error && <ListError message={error} onRetry={() => void refresh()} />}

      <DataTable
        caption="Saldos de estoque"
        columns={columns}
        rows={items}
        getRowKey={(row) => row.stockLevelId}
        rowTone={(row) => (row.status === "CRITICAL" ? "danger" : undefined)}
        expandable={{
          isExpanded: (row) => expandedId === row.stockLevelId,
          onToggle: (row) => void toggle(row),
          label: (row) => `Ver movimentos de ${row.sku}`,
          render: (row) => (
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="m-0 text-[15px] font-semibold tracking-[-0.015em] text-foreground">Últimos 5 movimentos</h3>
                <button type="button" onClick={() => setDrawer(row)} className={`${secondaryActionClass} !h-9 !px-3.5 !text-[13.5px]`}>
                  <ExternalLink size={14} aria-hidden /> Ver detalhes
                </button>
              </div>
              <MovementTable movements={movements[row.stockLevelId]} loading={loadingMovements === row.stockLevelId} />
            </div>
          ),
        }}
        loading={loading}
        minWidth={820}
        empty={
          !error && (
            <EmptyState
              icon={Package}
              message={filtered ? "Nenhum saldo de estoque encontrado para os filtros informados." : "Ainda não há saldos. Cadastre produtos e registre uma entrada para começar."}
              action={!filtered && <Link href="/products" className={secondaryActionClass}>Ver produtos</Link>}
            />
          )
        }
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={(next) => { setPage(next); setExpandedId(null); }} noun={["saldo", "saldos"]} />

      <AnimatePresence>
        {drawer && <InventoryDrawer item={drawer} movements={movements[drawer.stockLevelId] ?? []} onClose={() => setDrawer(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {dialogItems && (
          <MovementDialog
            items={dialogItems}
            onClose={() => setDialogItems(null)}
            onSuccess={async (message) => {
              setMovements({});
              await refresh();
              setNotice({ type: "success", message });
            }}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}
