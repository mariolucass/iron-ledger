/** Antes e depois de um registro, com as chaves que mudaram em destaque. */
export function AuditDiff({ before, after }: { before: Record<string, unknown>; after: Record<string, unknown> }) {
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  const changed = (key: string) => JSON.stringify(before[key]) !== JSON.stringify(after[key]);

  const column = (label: string, values: Record<string, unknown>, accent: string, highlight: string) => (
    <div className="bg-[rgb(var(--surface-rgb)/0.6)] p-4">
      <div className={`mb-3 text-[12.5px] font-semibold ${accent}`}>{label}</div>
      <div className="grid gap-1.5">
        {keys.map((key) => (
          <div key={key} className={`rounded-lg px-2.5 py-1.5 font-mono text-[13px] ${changed(key) ? `${highlight} ${accent}` : "text-ink/55"}`}>
            <span className="opacity-70">{key}: </span>
            {JSON.stringify(values[key] ?? null)}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10">
      {column("Antes", before, "text-destructive", "bg-destructive-soft")}
      {column("Depois", after, "text-primary", "bg-primary-soft")}
    </div>
  );
}
