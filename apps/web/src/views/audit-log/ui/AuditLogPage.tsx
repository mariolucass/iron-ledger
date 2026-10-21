"use client";

import { AnimatePresence } from "framer-motion";
import { ScrollText } from "lucide-react";
import { useState } from "react";
import { AuditActionBadge, auditActionLabels, type AuditAction } from "@/entities/audit-log";
import { useDebounced } from "@/shared/lib/use-debounced";
import { dayRange } from "@/shared/lib/day-range";
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
  type Column,
} from "@/shared/ui/data-list";
import { DatePicker } from "@/shared/ui/kit/date-picker";
import { Layout } from "@/widgets/layout";
import { resourceLabels, resourceOptions, type AuditEntry } from "../model/auditData";
import { fetchAuditPage, PAGE_SIZE } from "../model/load-audit-entries";
import { AuditDrawer } from "./AuditDrawer";

const actionOptions = [
  { value: "", label: "Todas as ações" },
  ...(Object.keys(auditActionLabels) as AuditAction[]).map((value) => ({ value, label: auditActionLabels[value]! })),
];

const columns: Column<AuditEntry>[] = [
  { id: "time", header: "Data e hora", className: "whitespace-nowrap font-mono text-[13px]", cell: (entry) => entry.ts },
  { id: "user", header: "Usuário", className: "text-white/70", cell: (entry) => entry.user },
  { id: "action", header: "Ação", cell: (entry) => <AuditActionBadge action={entry.action} /> },
  {
    id: "resource",
    header: "Recurso",
    cell: (entry) => (
      <span className="grid">
        <span className="text-[13.5px] text-white/70">{resourceLabels[entry.resource] ?? entry.resource}</span>
        <span className="font-mono text-[12.5px] text-white/55">{entry.resourceId}</span>
      </span>
    ),
  },
  {
    id: "corr",
    header: "Correlação",
    hideBelow: "lg",
    className: "max-w-[200px] font-mono text-[12.5px] text-white/55",
    cell: (entry) => <span className="block truncate" title={entry.corrId}>{entry.corrId}</span>,
  },
];

export function AuditLogPage() {
  const [resource, setResource] = useState("");
  const [action, setAction] = useState("");
  const [correlation, setCorrelation] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuditEntry | null>(null);
  const correlationQuery = useDebounced(correlation.trim());

  const { items, total, loading, error, refresh } = useRemoteList(
    () =>
      fetchAuditPage({
        entityType: resource || undefined,
        action: (action || undefined) as AuditAction | undefined,
        correlationId: correlationQuery || undefined,
        page,
        ...dayRange(from, to),
      }),
    [resource, action, correlationQuery, from, to, page],
  );

  const filtered = Boolean(resource || action || correlationQuery || from || to);
  const reset = <T,>(set: (value: T) => void) => (value: T) => { set(value); setPage(1); };

  return (
    <Layout title="Log de auditoria">
      <PageHeader title="Log de auditoria" description="Quem fez o quê e quando, com os dados de cada evento." />

      <FilterBar columns="md:grid-cols-[1fr_200px_200px]">
        <SearchField value={correlation} onChange={reset(setCorrelation)} placeholder="Buscar ID de correlação" />
        <SelectField label="Filtrar por recurso" value={resource} onChange={reset(setResource)} options={resourceOptions} />
        <SelectField label="Filtrar por ação" value={action} onChange={reset(setAction)} options={actionOptions} />
      </FilterBar>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <DatePicker aria-label="Data inicial" placeholder="Data inicial" value={from} max={to || undefined} onChange={reset(setFrom)} className="h-11" />
        <span aria-hidden className="text-white/45">–</span>
        <DatePicker aria-label="Data final" placeholder="Data final" value={to} min={from || undefined} onChange={reset(setTo)} className="h-11" />
      </div>

      {error && <ListError message={error} onRetry={() => void refresh()} />}

      <DataTable
        caption="Registros de auditoria"
        columns={columns}
        rows={items}
        getRowKey={(entry) => entry.eventId}
        onRowClick={setSelected}
        loading={loading}
        minWidth={760}
        empty={
          !error && (
            <EmptyState
              icon={ScrollText}
              message={filtered ? "Nenhum registro de auditoria encontrado para os filtros informados." : "Ainda não há registros de auditoria."}
            />
          )
        }
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} noun={["registro", "registros"]} />

      <AnimatePresence>{selected && <AuditDrawer entry={selected} onClose={() => setSelected(null)} />}</AnimatePresence>
    </Layout>
  );
}
