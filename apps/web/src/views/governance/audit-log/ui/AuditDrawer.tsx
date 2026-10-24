import { AuditActionBadge, auditActionLabels } from "@/entities/audit-log";
import { Drawer } from "@/shared/ui/drawer";
import { resourceLabels, type AuditEntry } from "../model/auditData";
import { AuditDiff } from "./AuditDiff";

export function AuditDrawer({ entry, onClose }: { entry: AuditEntry; onClose: () => void }) {
  const hasQuantityDiff = entry.payload.previousQuantity !== undefined && entry.payload.resultingQuantity !== undefined;
  const facts = [
    { label: "Usuário", value: entry.user },
    { label: "Data e hora", value: entry.ts },
    { label: "Evento", value: entry.eventName },
    { label: "Correlação", value: entry.corrId },
    { label: "ID do evento", value: entry.eventId },
  ];

  return (
    <Drawer
      eyebrow="Registro de auditoria"
      title={auditActionLabels[entry.action] ?? entry.action}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <AuditActionBadge action={entry.action} />
          {resourceLabels[entry.resource] ?? entry.resource} · <span className="font-mono text-foreground">{entry.resourceId}</span>
        </span>
      }
      onClose={onClose}
    >
      <dl className="m-0 grid grid-cols-2 gap-3">
        {facts.map(({ label, value }, index) => (
          <div key={label} className={`rounded-2xl border border-ink/10 bg-ink/[0.03] p-4 ${index === facts.length - 1 ? "col-span-2" : ""}`}>
            <dt className="mb-1.5 text-[13px] text-ink/55">{label}</dt>
            <dd className="m-0 font-mono text-[13px] break-all text-foreground">{value}</dd>
          </div>
        ))}
      </dl>

      {hasQuantityDiff && (
        <section aria-labelledby="audit-diff-title">
          <h3 id="audit-diff-title" className="m-0 mb-3 text-[15px] font-semibold tracking-[-0.015em] text-foreground">Alteração de saldo</h3>
          <AuditDiff before={{ quantity: entry.payload.previousQuantity }} after={{ quantity: entry.payload.resultingQuantity }} />
        </section>
      )}

      <section aria-labelledby="audit-payload-title">
        <h3 id="audit-payload-title" className="m-0 mb-3 text-[15px] font-semibold tracking-[-0.015em] text-foreground">Dados do evento</h3>
        <pre className="m-0 max-h-[320px] overflow-auto rounded-2xl border border-ink/10 bg-sunken p-4 font-mono text-[12.5px] leading-relaxed text-ink/75">
          {Object.keys(entry.payload).length ? JSON.stringify(entry.payload, null, 2) : "Sem dados adicionais."}
        </pre>
      </section>
    </Drawer>
  );
}
