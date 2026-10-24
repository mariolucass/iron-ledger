import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { InventoryStatusBadge } from "@/entities/inventory";
import { secondaryActionClass } from "@/shared/ui/data-list";
import { Drawer } from "@/shared/ui/drawer";
import type { InventoryItem, Movement } from "../model/inventoryData";
import { MovementCards } from "./MovementHistory";

const availableTone = { OK: "text-foreground", LOW: "text-warning", CRITICAL: "text-destructive" } as const;

export function InventoryDrawer({ item, movements, onClose }: { item: InventoryItem; movements: Movement[]; onClose: () => void }) {
  const facts: { label: string; value: string | number; className?: string }[] = [
    { label: "Depósito", value: item.warehouse },
    { label: "Último movimento", value: item.lastMovement },
    { label: "Disponível", value: item.available, className: `font-mono ${availableTone[item.status]}` },
    { label: "Reservado", value: item.reserved, className: "font-mono" },
  ];

  return (
    <Drawer
      eyebrow="Detalhes do SKU"
      title={item.product}
      subtitle={<span className="flex items-center gap-2"><span className="font-mono text-primary">{item.sku}</span><InventoryStatusBadge status={item.status} /></span>}
      onClose={onClose}
      footer={
        <Link href="/audit-log" className={`${secondaryActionClass} mt-auto w-full`}>
          <ExternalLink size={15} aria-hidden /> Ver no log de auditoria
        </Link>
      }
    >
      <dl className="m-0 grid grid-cols-2 gap-3">
        {facts.map(({ label, value, className }) => (
          <div key={label} className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-4">
            <dt className="mb-1.5 text-[13px] text-ink/55">{label}</dt>
            <dd className={`m-0 text-[17px] font-semibold tracking-[-0.01em] ${className ?? "text-foreground"}`}>{value}</dd>
          </div>
        ))}
      </dl>
      <section aria-labelledby="movement-history-title">
        <h3 id="movement-history-title" className="m-0 mb-3.5 text-[15px] font-semibold tracking-[-0.015em] text-foreground">Histórico de movimentações</h3>
        <MovementCards movements={movements} />
      </section>
    </Drawer>
  );
}
