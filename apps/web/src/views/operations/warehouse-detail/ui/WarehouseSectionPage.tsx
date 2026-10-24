"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { auditLogApi, type AuditLog } from "@/entities/audit-log";
import { warehouseApi, type WarehouseDetail } from "@/entities/warehouse";
import { withSession } from "@/shared/auth/with-session";
import { PageHeader, secondaryActionClass } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";
import { warehouseDetailPages } from "../model/pages";

type Section =
  | "inventory"
  | "locations"
  | "movements"
  | "reservations"
  | "transfers"
  | "counts"
  | "access"
  | "settings"
  | "auditLog";
type Row = {
  id: string;
  title: string;
  subtitle?: string;
  fields: [string, string][];
  href?: Route;
};
const number = (value: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(value);
const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
        new Date(value),
      )
    : "—";
const value = (input: unknown): string =>
  input == null ? "—" : typeof input === "object" ? JSON.stringify(input) : String(input);

async function loadRows(
  id: string,
  section: Section,
  page: number,
): Promise<{ rows: Row[]; total: number }> {
  switch (section) {
    case "locations": {
      const warehouse = await warehouseApi.get(id);
      return {
        total: warehouse.locations.length,
        rows: warehouse.locations.map((item) => ({
          id: item.id,
          title: item.name || item.code,
          subtitle: `${item.code} · ${item.path}`,
          href: `/warehouses/${id}/locations/${item.id}` as Route,
          fields: [
            ["Tipo", item.type],
            ["Estado", item.isActive ? "Ativa" : "Inativa"],
            ["Separação", item.isPickable ? "Sim" : "Não"],
            ["Recebimento", item.isReceivable ? "Sim" : "Não"],
          ],
        })),
      };
    }
    case "inventory": {
      const result = await warehouseApi.inventory(id, page);
      return {
        total: result.total,
        rows: result.items.map((item) => ({
          id: item.id,
          title: item.productName,
          subtitle: item.sku,
          href: `/products/${item.productId}` as Route,
          fields: [
            ["Saldo", `${number(item.quantity)} ${item.unit}`],
            ["Reservado", number(item.reserved)],
            ["Disponível", number(item.available)],
            ["Em trânsito", number(item.incoming)],
            ["Mínimo", number(item.minStock)],
          ],
        })),
      };
    }
    case "movements": {
      const result = await warehouseApi.movements(id, page);
      return {
        total: result.total,
        rows: result.items.map((item) => ({
          id: item.id,
          title: item.productName,
          subtitle: `${item.sku} · ${date(item.occurredAt)}`,
          href: `/products/${item.productId}` as Route,
          fields: [
            ["Tipo", item.type],
            ["Quantidade", `${number(item.quantity)} ${item.unit}`],
            ["Referência", value(item.referenceId)],
            ["Observação", value(item.notes)],
          ],
        })),
      };
    }
    case "reservations": {
      const result = await warehouseApi.reservations(id, page);
      return {
        total: result.total,
        rows: result.items.map((item) => ({
          id: item.id,
          title: item.productName,
          subtitle: `${item.sku} · ${date(item.createdAt)}`,
          href: `/products/${item.productId}` as Route,
          fields: [
            ["Quantidade", `${number(item.quantity)} ${item.unit}`],
            ["Estado", item.status],
            ["Transação", value(item.transactionId)],
            ["Expira", date(item.expiresAt)],
          ],
        })),
      };
    }
    case "transfers": {
      const result = await warehouseApi.transfers(id, page);
      return {
        total: result.total,
        rows: result.items.map((item) => ({
          id: item.id,
          title: item.code,
          subtitle: date(item.requestedAt),
          fields: [
            ["Direção", item.direction === "OUTBOUND" ? "Saída" : "Entrada"],
            ["Origem", item.sourceName],
            ["Destino", item.destinationName],
            ["Itens", number(item.itemCount)],
            ["Estado", item.status],
            ["Previsão", date(item.expectedAt)],
          ],
        })),
      };
    }
    case "counts": {
      const result = await warehouseApi.counts(id, page);
      return {
        total: result.total,
        rows: result.items.map((item) => ({
          id: item.id,
          title: item.code,
          subtitle: date(item.createdAt),
          fields: [
            ["Tipo", item.type],
            ["Estado", item.status],
            ["Itens", number(item.itemCount)],
            ["Cega", item.isBlind ? "Sim" : "Não"],
            ["Agendada", date(item.scheduledAt)],
            ["Concluída", date(item.completedAt)],
          ],
        })),
      };
    }
    case "access": {
      const items = await warehouseApi.access(id);
      return {
        total: items.length,
        rows: items.map((item) => ({
          id: item.userId,
          title: item.name,
          subtitle: item.email,
          fields: [
            ["Nível", item.accessLevel],
            ["Estado do usuário", item.userStatus],
            ["Concedido", date(item.grantedAt)],
            ["Expira", date(item.expiresAt)],
          ],
        })),
      };
    }
    case "settings": {
      const items = await warehouseApi.settings(id);
      return {
        total: items.length,
        rows: items.map((item) => ({
          id: item.key,
          title: item.key,
          subtitle: item.description ?? undefined,
          fields: [
            ["Valor", value(item.value)],
            ["Versão", number(item.version)],
            ["Atualizado", date(item.updatedAt)],
          ],
        })),
      };
    }
    case "auditLog": {
      const result = await auditLogApi.list({
        entityType: "Warehouse",
        entityId: id,
        page,
        pageSize: 20,
      });
      return {
        total: result.total,
        rows: result.items.map((item: AuditLog) => ({
          id: item.id,
          title: item.eventName,
          subtitle: date(item.occurredAt),
          fields: [
            ["Ação", item.action],
            ["Autor", item.actorEmail ?? "Sistema"],
            ["Evento", item.eventId],
          ],
        })),
      };
    }
  }
}

export function WarehouseSectionPage({
  warehouseId,
  section,
}: {
  warehouseId: string;
  section: Section;
}) {
  const config = warehouseDetailPages[section](warehouseId);
  const [warehouse, setWarehouse] = useState<WarehouseDetail | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    withSession(Promise.all([warehouseApi.get(warehouseId), loadRows(warehouseId, section, page)]))
      .then(([detail, result]) => {
        if (!cancelled) {
          setWarehouse(detail);
          setRows(result.rows);
          setTotal(result.total);
          setLoading(false);
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(
            reason instanceof Error ? reason.message : "Não foi possível carregar os dados.",
          );
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [warehouseId, section, page, attempt]);
  const paginated = !["locations", "access", "settings"].includes(section);
  return (
    <Layout title={config.title}>
      <div className="pb-10">
        <PageHeader
          back={{
            href: `/warehouses/${warehouseId}` as Route,
            label: warehouse?.name ?? "Armazém",
          }}
          title={config.title}
          description={config.description}
        />
        {loading ? (
          <p role="status" className="rounded-2xl border border-border bg-card p-6">
            Carregando…
          </p>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-border bg-card p-6">
            <p>{error}</p>
            <button
              type="button"
              className={secondaryActionClass}
              onClick={() => setAttempt((current) => current + 1)}
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {number(total)} {total === 1 ? "registro" : "registros"}
            </p>
            {rows.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
                Nenhum registro encontrado.
              </div>
            ) : (
              <div className="grid gap-3">
                {rows.map((row) => (
                  <article key={row.id} className="rounded-2xl border border-border bg-card p-5">
                    <h2 className="m-0 text-base font-semibold">
                      {row.href ? (
                        <Link href={row.href} className="hover:underline">
                          {row.title}
                        </Link>
                      ) : (
                        row.title
                      )}
                    </h2>
                    {row.subtitle && (
                      <p className="mb-0 mt-1 text-sm text-muted-foreground">{row.subtitle}</p>
                    )}
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      {row.fields.map(([label, field]) => (
                        <div key={label}>
                          <dt className="text-muted-foreground">{label}</dt>
                          <dd className="mt-1 break-words font-medium">{field}</dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                ))}
              </div>
            )}
            {paginated && total > 20 && (
              <nav aria-label="Paginação" className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  className={secondaryActionClass}
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Anterior
                </button>
                <span className="text-sm">
                  Página {page} de {Math.ceil(total / 20)}
                </span>
                <button
                  type="button"
                  className={secondaryActionClass}
                  disabled={page * 20 >= total}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Próxima
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
